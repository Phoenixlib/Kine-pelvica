# Plan de Ejecución: Sistema de Verificación Segura de Pacientes (Petit Salon)

Este documento describe detalladamente la arquitectura, los endpoints y los flujos frontend necesarios para implementar un sistema seguro y con resguardo de privacidad de datos para la búsqueda e identificación de pacientes/clientes recurrentes antes de agendar citas (Cal.com u otro widget).

---

## 📌 Contexto y Objetivos

1. **Evitar ambigüedades en nombres comunes:** Cuando un usuario recurrente ingresa solo un nombre parcial (ej. "Pablo"), el sistema debe permitirle elegir a cuál registro corresponde.
2. **Seguridad y Privacidad (Masking):** La búsqueda inicial no debe retornar información personal identificable. Los correos y teléfonos se retornan enmascarados desde el backend (ej. `p****z@gmail.com` y `+56 9 **** 1234`).
3. **Verificación de Identidad sin SMS:** Se solicita al usuario ingresar los **4 dígitos del medio (los dígitos ocultos)** del teléfono móvil para confirmar que posee el celular asociado a la cuenta.
4. **Prellenado del Widget de Cita:** Al verificarse correctamente, el backend retorna los datos limpios para prellenar el widget de agendamiento de forma segura.

---

## 🛠️ Paso 1: Base de Datos (Prisma ORM)

Asegurarse de que el modelo `Patient` (o `Owner` / `Client` en el proyecto destino) posea al menos los siguientes campos indexados:

```prisma
model Patient {
  id        String   @id @default(cuid())
  firstName String
  lastName  String
  email     String?  @unique
  phone     String   // Formato esperado: +569XXXXXXXX o 9XXXXXXXX
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 📡 Paso 2: Endpoint de Búsqueda Enmascarada (`GET /api/pacientes/lookup`)

Este endpoint recibe la query del usuario y busca coincidencias por teléfono o nombre. Retorna un listado limitado (máx. 5 coincidencias) con la información enmascarada.

### Código de Referencia

Crear o modificar el endpoint de consulta (ej. `src/app/api/pacientes/lookup/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db"; // Ajustar la ruta al cliente de base de datos del proyecto

export async function GET(req: NextRequest) {
  const queryParam = req.nextUrl.searchParams.get("query");

  if (!queryParam || queryParam.trim().length < 3) {
    return NextResponse.json(
      { error: "Búsqueda demasiado corta o vacía" },
      { status: 400 }
    );
  }

  const query = queryParam.trim();

  try {
    const isPhone = /[\d]/.test(query);
    let patients = [];

    if (isPhone) {
      // Normalizar número telefónico: remover todo excepto dígitos y el símbolo +
      const normalized = query.replace(/[^\d+]/g, "");
      // Extraer número base (remover prefijos del país si aplica, ej. +56 para Chile)
      const baseNumber = normalized.replace(/^\+?56/, "");

      patients = await db.patient.findMany({
        where: {
          OR: [
            { phone: { contains: normalized } },
            { phone: { contains: baseNumber } },
          ],
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });
    } else {
      // Búsqueda por palabras (Nombre y Apellido)
      const words = query.split(/\s+/).filter(Boolean);
      
      if (words.length > 0) {
        const whereClause = {
          AND: words.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: "insensitive" as const } },
              { lastName: { contains: word, mode: "insensitive" as const } },
              { email: { contains: word, mode: "insensitive" as const } },
            ],
          })),
        };

        patients = await db.patient.findMany({
          where: whereClause,
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        });
      }
    }

    if (!patients || patients.length === 0) {
      return NextResponse.json({ found: false });
    }

    // Enmascarar datos para preservar la privacidad en el frontend
    const maskedPatients = patients.map((p) => {
      let maskedEmail = null;
      if (p.email) {
        const [name, domain] = p.email.split("@");
        if (name && domain) {
          if (name.length > 2) {
            maskedEmail = `${name[0]}****${name[name.length - 1]}@${domain}`;
          } else {
            maskedEmail = `****@${domain}`;
          }
        }
      }

      // Obtener solo dígitos del teléfono
      const digits = p.phone.replace(/\D/g, "");
      // Obtener los últimos 4 dígitos
      const last4 = digits.length >= 4 ? digits.slice(-4) : digits;
      // Enmascarar la sección del medio (los 4 dígitos que se le pedirán verificar al usuario)
      const maskedPhone = `+56 9 **** ${last4}`;

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        maskedEmail,
        maskedPhone,
      };
    });

    return NextResponse.json({
      found: true,
      patients: maskedPatients,
    });
  } catch (error) {
    console.error("[Patient Lookup Error]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

---

## 🔒 Paso 3: Endpoint de Verificación Segura (`POST /api/pacientes/verify`)

Este endpoint recibe la respuesta del usuario con los dígitos que estaban ocultos. Valida la coincidencia exacta en backend sin exponer la base de datos de manera abierta.

### Código de Referencia

Crear o modificar el endpoint de verificación (ej. `src/app/api/pacientes/verify/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, hiddenDigits } = body;

    // Validación básica de entradas
    if (!id || !hiddenDigits || hiddenDigits.length !== 4) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Buscar al paciente
    const patient = await db.patient.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      }
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // Extraer los 4 dígitos del medio (ocultos).
    // Suponiendo formato de celular estándar:
    // Para +56 9 1234 5678 (dígitos limpios: 56912345678).
    // Tomamos slice(-8, -4), que corresponde a '1234'.
    const phoneDigits = patient.phone.replace(/\D/g, "");
    const expectedHidden = phoneDigits.length >= 8 ? phoneDigits.slice(-8, -4) : "";
    
    // Comparación estricta
    if (!expectedHidden || expectedHidden !== hiddenDigits) {
      return NextResponse.json({ error: "Los dígitos no coinciden" }, { status: 400 });
    }

    // Retornar datos de éxito y perfil des-enmascarado para rellenar el formulario de reserva
    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
      }
    });

  } catch (error) {
    console.error("[Patient Verify Error]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Paso 4: Implementación de Interfaz de Usuario (Frontend)

El flujo debe modelarse como una máquina de estados con tres pasos principales:
1. `lookup`: Formulario inicial de búsqueda.
2. `verification`: Selección de perfil enmascarado y/o ingreso de código de verificación.
3. `embed`: Carga del widget de reserva (Cal.com u otro) con parámetros de prellenado seguros.

### Lógica del Flujo (React Component)

Asegúrate de definir los siguientes estados:

```typescript
type Step = "lookup" | "verification" | "embed";

const [step, setStep] = useState<Step>("lookup");
const [query, setQuery] = useState("");
const [patients, setPatients] = useState<any[]>([]);
const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
const [verificationCode, setVerificationCode] = useState("");
const [prefill, setPrefill] = useState<any>({});
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
```

#### Acción de Búsqueda (Lookup):
Llamar al endpoint `GET /api/pacientes/lookup?query={query}`. Si `found` es `true`, guardar `patients` y cambiar `step` a `"verification"`.

#### Acción de Verificación:
Llamar al endpoint `POST /api/pacientes/verify` enviando `{ id: selectedPatientId, hiddenDigits: verificationCode }`.
* Si es exitoso, construir el objeto `prefill` y cambiar `step` a `"embed"`.
* Si falla, desplegar el error en pantalla.

### Renderizado de Vistas (JSX/TSX)

#### Paso 1: Lookup (Búsqueda inicial)
Formulario simple que pregunta nombre o teléfono del cliente.

#### Paso 2: Selección y Verificación (`step === "verification"`)
* **Si `selectedPatientId === null`:** Mostrar la lista de pacientes encontrados con sus datos enmascarados para que el usuario seleccione el correcto.
* **Si `selectedPatientId` ya está seleccionado:** Mostrar un formulario donde se le indica al usuario:
  > *"Por seguridad, ingresa los **4 dígitos ocultos** de tu celular registrado (`+56 9 **** 1234`)"*
  
  Implementar un campo de entrada numérico optimizado para celular:
  ```tsx
  <input
    type="text"
    placeholder="Ej: 1234"
    maxLength={4}
    value={verificationCode}
    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
    className="text-center font-bold text-xl tracking-widest"
    required
  />
  ```

#### Paso 3: Embed (`step === "embed"`)
Renderizar el componente iframe o modal del proveedor de agendas (ej. `Cal.com` o `SimplyBook`) pasando el objeto `prefill` que ya tiene los datos limpios garantizados por el servidor.

---

## 🧪 Estrategia de Testing Recomendada

1. **Casos de Teléfonos Cortos:** Validar qué ocurre si el celular en la base de datos no cuenta con 8 dígitos mínimos (después del prefijo de país). El backend debe gestionar este escenario defensivamente.
2. **Números sin prefijo:** Validar el reemplazo `/^\+?56/` para asegurar que el matching de base sea robusto tanto si se busca con `+569...` como `9...`.
3. **Casos de Homónimos:** Insertar registros con el mismo nombre y apellido pero diferentes números telefónicos y correos electrónicos. Validar que la interfaz los diferencie correctamente usando el correo y teléfono enmascarados.
