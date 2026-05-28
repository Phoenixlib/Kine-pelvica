# Plan de Desarrollo — Panel Admin Estudio Pélvico Camila Ortiz

> **Stack:** Next.js 15 (App Router) · tRPC · Prisma ORM → Neon (PostgreSQL) · Sanity CMS · Tailwind CSS  
> **Foco de UX:** Mobile-first estricto. Primario: celular y tablet.

---

## Lecciones Aprendidas de Petitsalon (No Repetir Errores)

| Patrón aprendido | Aplicación en este proyecto |
|---|---|
| **Tabla vs Cards mobile** → en Petitsalon la tabla está oculta en mobile con `hidden lg:table`, y hay cards separadas. Esto duplica el código. | Usar el mismo patrón pero con un componente `<AppointmentCard>` reutilizable que cambie su layout por breakpoint |
| **Paginación obligatoria** → `ITEMS_PER_PAGE = 20` en citas, `12` en galería, todas con `?page=N` en la URL | Implementar paginación desde el primer commit en citas, pacientes, blog y galería |
| **Debounce en búsqueda** → 400ms en el `useEffect` del search input, sin bloquear la navegación | Igual: debounce 400ms + `startTransition` |
| **`useEffect` para sincronizar props** → `setItems(initialItems)` cuando las props cambian por revalidación | Aplicar en todos los Client Components que reciban `initialData` |
| **Cloudinary para imágenes** → Endpoint `/api/admin/upload-signature` + subida directa desde el cliente. Nunca base64 en DB | Reutilizar el mismo patrón para galería y fotos de perfil |
| **Modal de detalle de cita** → `AppointmentDetailModal` con `AnimatePresence` y `initialStep` para flujos multistep | Crear `AppointmentDetailModal` local adaptado a los estados de Camila |
| **`requireAdmin()`** al inicio de cada Server Action | Igual: crear helper `requireAdmin()` reutilizable |
| **revalidatePath múltiple** → revalidar `/admin`, `/admin/citas` y `/admin/agenda` en cada mutación | Igual |
| **Cancelar desde Cal.com abre ventana externa** → en Petitsalon abre `app.cal.com` en `_blank`, no está integrado | **Aquí sí hay que usar la Cal.com API** para cancelar nativamente |
| **WhatsApp link directo** → `https://wa.me/{phone}` con el número limpio (sin `+`, guiones, etc.) | Mismo patrón, botón WhatsApp en ficha de paciente |

---

## Migración del Schema Prisma (SQLite → PostgreSQL/Neon)

> [!IMPORTANT]
> El proyecto actual usa **SQLite con `dev.db`**. Hay que migrar a **Neon (PostgreSQL)** antes de construir los módulos. Sin esto, no hay enums ni arrays.

### Cambios requeridos en `schema.prisma`

```diff
 datasource db {
-  provider = "sqlite"
-  url      = "file:./dev.db"
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
+  directUrl = env("DIRECT_URL")
 }
```

### Schema completo propuesto

```prisma
// --- Autenticación ---
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  password  String   // bcrypt hash
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// --- Pacientes ---
model Patient {
  id           String        @id @default(cuid())
  firstName    String
  lastName     String
  email        String?       @unique
  phone        String?
  rut          String?       @unique
  birthDate    DateTime?
  notes        String?
  status       PatientStatus @default(ACTIVE)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  appointments Appointment[]
}

enum PatientStatus {
  ACTIVE
  INACTIVE
}

// --- Citas ---
model Appointment {
  id              String            @id @default(cuid())
  patientId       String
  patient         Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)
  title           String
  serviceId       String?
  service         Service?          @relation(fields: [serviceId], references: [id])
  date            DateTime
  durationMinutes Int               @default(60)
  status          AppointmentStatus @default(BOOKED)
  paymentMethod   PaymentMethod?    // null hasta que informen
  cancelReason    String?           // obligatorio si status=CANCELLED
  calComEventId   String?           @unique
  calComBookingId String?           @unique
  notes           String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

enum AppointmentStatus {
  BOOKED          // Reservado (hora pedida)
  CASH_PENDING    // Pago en efectivo (informó que pagará el día)
  TRANSFERRED     // Transferido (pagó por transferencia)
  CANCELLED       // Cancelado desde el admin (requiere cancelReason)
  ATTENDED        // Asistió y todo pagado
  NO_SHOW         // No asistió
}

enum PaymentMethod {
  CASH
  TRANSFER
}

// --- Servicios ---
model ServiceCategory {
  id        String    @id @default(cuid())
  name      String
  order     Int       @default(0)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  services  Service[]
}

model Service {
  id           String           @id @default(cuid())
  name         String
  price        Int              // CLP, sin decimales
  duration     Int              // minutos
  description  String?
  isActive     Boolean          @default(true)
  order        Int              @default(0)
  categoryId   String?
  category     ServiceCategory? @relation(fields: [categoryId], references: [id])
  appointments Appointment[]
}

// --- Galería Antes/Después ---
model GalleryPhoto {
  id        String   @id @default(cuid())
  beforeUrl String   // Cloudinary URL "Antes"
  afterUrl  String   // Cloudinary URL "Después"
  caption   String?
  order     Int      @default(0)
  isVisible Boolean  @default(true)
  createdAt DateTime @default(now())
}

// --- Testimonios (del formulario del landing) ---
model Testimonial {
  id        String            @id @default(cuid())
  name      String
  email     String?
  message   String
  status    TestimonialStatus @default(PENDING)
  createdAt DateTime          @default(now())
}

enum TestimonialStatus {
  PENDING   // Sin leer
  READ      // Leído
  ARCHIVED  // Archivado
}

// --- Blog ---
// Nota: los posts se gestionan en Sanity CMS.
// Este modelo es solo para metadata local si se necesita.
// Recomendación: Gestionar blog 100% en Sanity Studio.

// --- Config general del sitio (Quién Soy, etc.) ---
model SiteConfig {
  key       String   @id  // "about_title", "about_description"
  value     String
  updatedAt DateTime @updatedAt
}
```

---

## Módulo 1 — Agenda & Citas con Cal.com API

### Análisis de la Cal.com API

> [!TIP]
> Cal.com tiene una **API REST v2** (`api.cal.com/v2`). Con la API key del usuario se puede:
> - `GET /bookings` — Listar reservas con filtros de fecha
> - `PATCH /bookings/{bookingId}/reschedule` — Reagendar
> - `POST /bookings/{bookingId}/cancel` — Cancelar (con `reason`)
> - `GET /schedules` — Ver disponibilidad configurada
> - `POST /schedules` — Crear bloques horarios
> - `GET /event-types` — Listar tipos de evento

**Recomendación de arquitectura:**
1. Cal.com sigue siendo el sistema de reservas del lado del cliente (landing page → paciente elige hora).
2. El webhook `BOOKING_CREATED` / `BOOKING_CANCELLED` / `BOOKING_RESCHEDULED` sincroniza el estado a nuestra BD.
3. Desde el admin, las acciones de cancelar/reagendar llaman a **nuestros Server Actions**, que a su vez llaman a la Cal.com API y luego actualizan Prisma.

### Variables de entorno requeridas

```bash
CALCOM_API_KEY=cal_live_xxxxxxxxxxxxxxxx
CALCOM_API_URL=https://api.cal.com/v2
CALCOM_WEBHOOK_SECRET=xxxxxxxx  # ya existe
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REFRESH_TOKEN=...
```

### Página `/admin/agenda`

- **Vista:** Calendario semanal/mensual embebido via **FullCalendar** (igual que en Petitsalon).
- **Fuente de datos:** Server Component carga citas del día desde Prisma + disponibilidad desde Cal.com API.
- **Click en espacio vacío:** Modal para crear cita manual o bloquear hora (POST a Cal.com + Prisma).
- **Click en cita existente:** Abre `AppointmentDetailModal`.

### Página `/admin/citas`

- **Tabla con Cards mobile** (patrón Petitsalon).
- **Pestañas de filtro por estado:** Todas | Reservadas | Pago Efectivo | Transferidas | Asistió | No Asistió | Canceladas.
- **Búsqueda debounced** (400ms) por nombre del paciente.
- **Paginación:** 20 por página con `?page=N&status=X&q=busqueda`.
- **Acciones rápidas en card/fila:** Cambiar estado, abrir detalle.

### Estados y transiciones

```
BOOKED → CASH_PENDING | TRANSFERRED | CANCELLED
CASH_PENDING → ATTENDED | NO_SHOW | CANCELLED
TRANSFERRED → ATTENDED | NO_SHOW | CANCELLED
ATTENDED (terminal)
NO_SHOW (terminal, pero si era TRANSFERRED queda registrado)
CANCELLED → requiere cancelReason → llama Cal.com API
```

### `AppointmentDetailModal` — Flujo en pasos

1. **Detalle:** info completa, estado actual, botón WhatsApp
2. **Cambiar estado:** selector con confirmación
3. **Cancelar:** textarea obligatorio para `cancelReason`
4. **Reagendar:** date/time picker → llama `PATCH /bookings/{id}/reschedule` de Cal.com

### Google Calendar

- Usar **googleapis** (`@googleapis/calendar`) con OAuth2.
- Crear evento en Google Calendar cuando una cita pasa a `ATTENDED`.
- Sincronizar bloqueos horarios bidireccional (webhook Cal.com → Prisma → Google Calendar).

---

## Módulo 2 — Fichas de Pacientes

### Página `/admin/pacientes`

- **Lista paginada** (20 por página) con búsqueda por nombre, email, teléfono.
- **Mobile:** Cards con nombre, teléfono, contador de citas y botón WhatsApp directo.
- **Desktop:** Tabla con columnas nombre, contacto, nº citas, último estado.
- **Botón `+ Nueva Paciente`:** Modal o página `/admin/pacientes/nuevo`.

### Página `/admin/pacientes/[id]`

Dividida en secciones:

#### Información básica (editable)
- Nombre, apellido, email, teléfono, RUT, fecha de nacimiento
- Notas clínicas privadas (textarea)
- Estado: Activa / Inactiva

#### Contadores de estadísticas (read-only, computed)
```
Total reservas:     [n]
Veces canceladas:   [n]
No asistió:         [n]
Asistidas:          [n]
Pagos en efectivo:  [n]
Pagos transferidos: [n]
```
Calculados con `prisma.appointment.groupBy` o con `_count`.

#### Historial de citas (paginado, 10 por página)
Por cita: fecha, hora, servicio, estado (badge de color).  
Acciones por cita: cambiar estado, enviar WhatsApp.

#### Botón WhatsApp global
```
wa.me/56{phone}?text=Hola%20{nombre}...
```
Link preformateado que abre WhatsApp con mensaje predeterminado.

---

## Módulo 3 — Edición de Contenido del Landing

### 3.1 — Quién Soy (`/admin/contenido/quien-soy`)

- Campos: `about_title` (input text) + `about_description` (textarea con `\n` preservados)
- Datos guardados en `SiteConfig` con claves `"about_title"` y `"about_description"`.
- La sección `<About>` del landing lee de `SiteConfig` en lugar de texto hardcodeado.

> [!NOTE]
> El textarea debe usar `white-space: pre-wrap` o `dangerouslySetInnerHTML` con `\n` convertidos a `<br>` en el landing para respetar saltos de línea.

### 3.2 — Servicios (`/admin/servicios`) con creación automática en Cal.com

> [!IMPORTANT]
> **El flujo de Petitsalon (crear evento en Cal.com manualmente → copiar link → pegarlo en el servicio) queda ELIMINADO.** Aquí todo es automático: al crear un servicio en la app, se crea el Event Type en Cal.com via API y el booking URL se guarda automáticamente en Prisma.

#### Flujo automático de creación de servicio

```
Admin llena formulario en la app
      ↓
Server Action `createServiceAction()`
      ├── 1. POST https://api.cal.com/v2/event-types  ← crea el evento en Cal.com
      │        body: { title, lengthInMinutes, slug, description }
      │        header: Authorization: Bearer {CALCOM_API_KEY}
      │        header: cal-api-version: 2024-06-14
      │
      ├── 2. Cal.com responde con { id, slug, bookingUrl }
      │
      └── 3. prisma.service.create({ ...serviceData, calComEventTypeId, calComBookingUrl })
```

#### Flujo automático de edición de servicio

```
Admin edita nombre o duración
      ↓
Server Action `updateServiceAction()`
      ├── 1. PATCH https://api.cal.com/v2/event-types/{calComEventTypeId}
      │        body: { title, lengthInMinutes, description }
      └── 2. prisma.service.update({ ...newData })
```

#### Flujo automático de eliminación de servicio

```
Admin elimina servicio
      ↓
Server Action `deleteServiceAction()`
      ├── 1. DELETE https://api.cal.com/v2/event-types/{calComEventTypeId}
      └── 2. prisma.service.delete({ id })
```

#### Campos adicionales en el modelo `Service` de Prisma

```prisma
model Service {
  // ...campos existentes...
  calComEventTypeId  Int?    // ID numérico del event type en Cal.com
  calComBookingUrl   String? // URL pública de reserva: cal.com/camila-ortiz/evaluacion
  calComSlug         String? // slug del evento para construir URLs
}
```

#### Implementación del Server Action

```ts
// src/app/admin/servicios/actions.ts
'use server'
import { env } from '@/env'

async function createCalComEventType(service: {
  name: string
  duration: number
  description?: string
}) {
  const slug = service.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const res = await fetch(`${env.CALCOM_API_URL}/event-types`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CALCOM_API_KEY}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-06-14',
    },
    body: JSON.stringify({
      title: service.name,
      slug,
      lengthInMinutes: service.duration,
      description: service.description ?? '',
    }),
  })

  if (!res.ok) throw new Error('Error al crear evento en Cal.com')
  const data = await res.json() as { data: { id: number; slug: string; bookingUrl: string } }
  return data.data
}

export async function createServiceAction(formData: FormData) {
  await requireAdmin()
  // 1. Crear en Cal.com
  const calEvent = await createCalComEventType({ name, duration, description })
  // 2. Guardar en Prisma con los IDs de Cal.com
  await prisma.service.create({
    data: {
      name, price, duration, description,
      categoryId,
      calComEventTypeId: calEvent.id,
      calComBookingUrl: calEvent.bookingUrl,
      calComSlug: calEvent.slug,
    }
  })
}
```

#### En el módulo de servicios del admin

- El formulario de nuevo servicio **no tiene campo de URL de Cal.com** — se genera solo.
- Al guardar, aparece un toast: _"Servicio creado y disponible para reservas en Cal.com ✓"_
- En la lista de servicios, cada servicio muestra un botón 🔗 que abre la URL de reserva en una nueva pestaña.
- Si la llamada a Cal.com falla, la creación completa se cancela (no se guarda en Prisma tampoco).

#### Patrón para toggle de visibilidad

- `isActive: false` → llama `PATCH /event-types/{id}` con `{ hidden: true }` en Cal.com.
- Así el evento desaparece de la página de booking de Cal.com y del landing.

---

La sección `<Services>` del landing **migra de Sanity a Prisma** para que la fuente de verdad sea una sola.

### 3.3 — Galería Antes y Después (`/admin/galeria`)

Diferencia clave vs Petitsalon: aquí las fotos son **pares** (antes/después).

- Formulario: subir imagen "Antes" + imagen "Después" + caption opcional.
- Ambas imágenes se suben a Cloudinary vía `/api/admin/upload-signature`.
- Grid en el admin: pares de imágenes con toggle visible/oculto, reordenar, eliminar.
- Paginación: 12 pares por página.
- La sección `<Gallery>` del landing renderiza los pares con slider comparativo.

### 3.4 — Blog (`/admin/blog` y `/studio`)

> [!IMPORTANT]
> **Sanity Studio SÍ puede vivir dentro de la app.** Es el patrón oficial recomendado por Sanity para proyectos Next.js.

#### Cómo embeber Sanity Studio en la app

Usando el paquete `next-sanity`, el Studio se monta como una ruta catch-all:

```
src/app/studio/[[...index]]/page.tsx   ← página del Studio
src/app/studio/[[...index]]/Studio.tsx ← Client Component wrapper
sanity.config.ts                       ← basePath: '/studio'
```

**Archivo `page.tsx`:**
```tsx
import { Studio } from './Studio'
export const dynamic = 'force-static'
export { metadata } from 'next-sanity/studio/metadata'
export { viewport } from 'next-sanity/studio/viewport'
export default function StudioPage() {
  return <Studio />
}
```

**Archivo `Studio.tsx`:**
```tsx
'use client'
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'
export function Studio() {
  return <NextStudio config={config} />
}
```

**`sanity.config.ts` (actualizar `basePath`):**
```ts
export default defineConfig({
  basePath: '/studio', // CRÍTICO: debe coincidir con la ruta
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
})
```

**Post-deploy:** Agregar el dominio de producción en [manage.sanity.io](https://manage.sanity.io) → API → CORS Origins con "Allow credentials" habilitado.

**Proteger la ruta `/studio`:** Agregar al middleware para que solo sea accesible para usuarios autenticados como admin.

```ts
// middleware.ts — agregar /studio a las rutas protegidas
config: { matcher: ['/admin/:path*', '/studio/:path*'] }
```

En el panel admin, el sidebar incluirá un enlace **"Editor de Blog"** que navega a `/studio`. La usuaria edita posts directamente dentro de la app, sin salir a un dominio externo.

### 3.5 — Bandeja de Testimonios (`/admin/testimonios`)

- Lista de mensajes enviados desde el formulario del landing.
- Estados: `PENDING` (sin leer, badge naranja) → `READ` → `ARCHIVED`.
- Acciones por testimonio: marcar como leído, archivar.
- Paginación: 20 por página.
- Al hacer click, ver el mensaje completo en un modal.

---

## Módulo 4 — Reseñas de Google

### Integración Google Places API

- Usar **Google Places API (New)** para obtener reseñas del negocio.
- Requiere `GOOGLE_PLACES_API_KEY` en `.env`.
- Endpoint: `GET https://places.googleapis.com/v1/places/{PLACE_ID}?fields=reviews`

> [!WARNING]
> Google no permite mostrar reseñas directamente desde la API en sitios públicos sin restricciones de marca. Revisar TOS antes de mostrar en el landing. En el admin no hay restricción.

### En el landing (`<Reviews>`)

- Las reseñas se muestran con datos reales desde la API (nombre, rating, texto, fecha).
- **Botón "Dejar reseña"** → link directo `https://g.page/r/{PLACE_ID}/review`.
- Fetch con `cache: 'revalidate'` cada 24h para no saturar la API.

### En el admin

- Vista de solo lectura de las últimas reseñas.
- Estadísticas: rating promedio, total de reseñas.

---

## Módulo 5 — Variables de Entorno Adicionales

```bash
# Neon PostgreSQL
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...  # sin pgbouncer, para migraciones

# Cal.com
CALCOM_API_KEY=cal_live_...
CALCOM_API_URL=https://api.cal.com/v2

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REFRESH_TOKEN=...

# Google Places (Reseñas)
GOOGLE_PLACES_API_KEY=...
GOOGLE_PLACE_ID=ChIJ...  # ID del negocio en Google Maps

# Google "Dejar reseña" link
GOOGLE_REVIEW_URL=https://g.page/r/XXXXX/review

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Roadmap de Implementación (5 Fases)

### Fase 0 — Fundación (HACER PRIMERO)
1. Migrar `schema.prisma` de SQLite a PostgreSQL/Neon
2. Crear cuenta en Neon, configurar `DATABASE_URL` y `DIRECT_URL`
3. Ejecutar `npx prisma migrate dev --name init_postgres`
4. Agregar todos los enums (`AppointmentStatus`, `PaymentMethod`, etc.)
5. Configurar Cloudinary y endpoint `/api/admin/upload-signature`

### Fase 1 — Citas (prioridad alta)
1. Rediseñar `/admin/citas` con los 7 estados nuevos y paginación
2. `AppointmentDetailModal` con flujo de estados y campo cancelReason
3. Server Actions para cada transición de estado
4. Botón WhatsApp en el modal de detalle

### Fase 2 — Pacientes (prioridad alta)
1. Migrar `/admin/pacientes` con los nuevos campos (firstName, lastName)
2. Página de detalle `/admin/pacientes/[id]` con contadores y historial
3. Búsqueda debounced + paginación

### Fase 3 — Agenda & Cal.com API (prioridad media)
1. Integrar FullCalendar en `/admin/agenda`
2. Implementar cancel y reschedule via Cal.com API
3. Click en espacio vacío → crear cita manual o bloquear hora
4. Google Calendar sync

### Fase 4 — Contenido (prioridad media)
1. `SiteConfig` para "Quién Soy"
2. Módulo de Servicios (port de Petitsalon)
3. Galería Antes/Después con pares de imágenes
4. Bandeja de Testimonios
5. Migrar `<Services>` del landing de Sanity a Prisma

### Fase 5 — Google Reseñas (prioridad baja)
1. Integrar Google Places API para mostrar reseñas reales
2. Botón "Dejar reseña" en el landing
3. Vista de reseñas en el admin

---

## Decisiones de Arquitectura Críticas

| Decisión | Elección | Razón |
|---|---|---|
| Gestión de citas externas | Cal.com via webhook + API | Evita construir un sistema de reservas desde cero |
| Imágenes | Cloudinary | No guardar binarios en BD; patrón probado en Petitsalon |
| Blog | Sanity CMS | Ya configurado, editor amigable para la usuaria |
| Quién Soy / SiteConfig | Prisma (`SiteConfig`) | No necesita CMS completo, es un texto simple |
| Servicios | Prisma | Reemplaza Sanity para unificar fuente de verdad |
| Reseñas Google | Google Places API | Mostrar reseñas reales y botón de dejar reseña |
| Autenticación admin | NextAuth con bcrypt | Ya implementado, no cambiar |

---

## Reglas Mobile-First para este proyecto

> [!IMPORTANT]
> El panel se usará principalmente desde **celular y tablet**. Reglas estrictas:

1. **Sin tablas horizontales en mobile.** Siempre cards equivalentes.
2. **Botones de acción de al menos 44px de alto** (touch target mínimo).
3. **Modales con `max-h-[90svh] overflow-y-auto`** para que no se corten en mobile.
4. **Tabs de filtro con scroll horizontal** (`overflow-x-auto snap-x`) si son más de 4 opciones.
5. **Buscador siempre al tope**, antes de la lista.
6. **Paginación mobile:** Solo botones "Anterior / Siguiente" (sin números de página individuales).
7. **WhatsApp como acción primaria** en toda ficha de paciente (botón verde prominente).

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cal.com API rate limits | Medio | Cachear disponibilidad 5min, no llamar en cada render |
| Google Places API costo | Bajo | Cache de 24h con `revalidate`, máx. 1 llamada/día |
| Timeout 10s en Vercel Hobby | Alto | Llamadas a Cal.com API en Server Actions, no en Route Handlers de streaming |
| Migración SQLite → Postgres | Alto | Hacer en Fase 0, antes de cualquier feature. Usar `DIRECT_URL` para migraciones |
| Webhook Cal.com sin verificación HMAC | Alto | Ya existe el código, verificar que esté activo en producción |
