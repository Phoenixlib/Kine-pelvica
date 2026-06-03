# Plan de Implementación: Refactorización de Interfaz de Citas (Estudio Pélvico)

Este documento detalla los pasos y el código necesario para refactorizar la sección de administración de citas (`/admin/citas`). Esta refactorización separará la gestión de "Estados de la Cita" y "Estados de Pago", rediseñará la tabla de citas, implementará un modal de detalle al estilo Petit Salon y gestionará cancelaciones sincronizadas con Cal.com.

## Paso 1: Actualización del Esquema de Base de Datos (Prisma)

Actualmente, `AppointmentStatus` mezcla estados de asistencia con pagos (`CASH_PENDING`, `TRANSFERRED`). El requerimiento es separarlos.

1.  Abre `prisma/schema.prisma`.
2.  Modifica los Enums y el modelo `Appointment`:

```prisma
// Reemplazar o actualizar los enums
enum AppointmentStatus {
  BOOKED          // Reservado
  CONFIRMED       // Confirmado
  ATTENDED        // Asiste
  NO_SHOW         // No asistió
  CANCELLED       // Cancelado
}

enum PaymentStatus {
  PENDING         // Pendiente (predeterminado)
  PAID_CASH       // Pagado en efectivo
  TRANSFERRED     // Transferido
}

// En el modelo Appointment:
// - Cambiar 'status' a usar los nuevos valores
// - Cambiar 'paymentMethod' a 'paymentStatus' (o agregar paymentStatus y dejar paymentMethod)
// Se sugiere:
model Appointment {
  // ... (otros campos)
  status          AppointmentStatus @default(BOOKED)
  paymentStatus   PaymentStatus     @default(PENDING)
  cancelReason    String?           // obligatorio si status=CANCELLED
  // ...
}
```

3.  Ejecuta `npx prisma db push` (o genera una migración) y corre `npx prisma generate`.
4.  **IMPORTANTE:** Deberás actualizar los validadores de Zod en `src/server/api/routers/appointment.ts` para aceptar los nuevos tipos de `status` y el nuevo campo `paymentStatus`.

## Paso 2: Creación de Componentes UI Auxiliares

### Modal de Notas
Crea un componente `NotesModal.tsx` o intégralo en `CitasClient.tsx`. Este modal simplemente recibe un texto (las notas de Cal.com) y lo muestra.

### Botones de Acción de Estado y Pago en la Tabla
Debes crear selectores o botones rápidos que permitan cambiar:
- **Estado de Cita:** Reservado -> Confirmado -> Asiste / No Asistió
- **Estado de Pago:** Pendiente -> Efectivo / Transferencia

## Paso 3: Refactorización de la Tabla de Citas (`CitasClient.tsx` / `page.tsx`)

1.  **Estructura de la Tabla (Desktop) / Cards (Mobile):**
    El orden estricto de las columnas debe ser:
    *   **Fecha/Hora:** Formateada claramente.
    *   **Paciente:** Nombre y Apellido.
    *   **Cita/Terapia:** Mostrar `appointment.service?.name` (El nombre desde nuestra BD, NO el título de Cal.com).
    *   **Medio/Estado de Pago:** Selector o Badge interactivo (Pendiente, Efectivo, Transferido).
    *   **Precio Servicio:** Formateado en CLP (ej. `$35.000`).
    *   **Notas:** Un ícono de información (ℹ️ o 📝).
        *   Si `appointment.notes` está vacío o es null: Icono deshabilitado/gris.
        *   Si tiene texto: Icono clickeable que abre un Modal de Notas.
    *   **Estado:** Badge con el estado de la cita (Reservado, Confirmado, Asistió, etc).
    *   **Acciones Rápidas:** Botones para transicionar el estado (Ej: Confirmar, Marcar Asistencia, Cancelar).
2.  **Eliminar Edición Inline:** Elimina el botón que abría un modal para editar la información cruda de la cita (fecha, servicio, etc.).
3.  **Filas Clickeables:** Al hacer click en cualquier parte de la fila (excepto en los botones de acción o en el ícono de notas), se debe abrir el `AppointmentDetailModal`.

## Paso 4: Implementación del `AppointmentDetailModal`

Toma como referencia el archivo `/home/pablo-finix/DEV/Petitsalon/src/components/admin/AppointmentDetailModal.tsx` pero adáptalo a Kine Pélvica.

1.  **Datos a mostrar:**
    *   Nombre del Paciente y Teléfono.
    *   Nombre del Servicio (Terapia), Precio y Duración.
    *   Fecha y Hora.
    *   Notas.
2.  **Botones de WhatsApp:**
    *   Mantener el botón "Recordatorio".
    *   **ELIMINAR** el botón "Retiro Listo".
3.  **Botones de Estado (Flujo):**
    *   Si está `BOOKED`: Botón principal "Confirmar Cita", botón secundario "Cancelar Cita".
    *   Si está `CONFIRMED`: Botones "Marcar como Asistió", "No Asistió", "Revertir a Reservado", "Cancelar Cita".
    *   *Nota:* Las acciones reversibles deben usar mutaciones de tRPC (`updateAppointmentStatus` o similar).
4.  **Flujo de Cancelación:**
    *   Al clickear "Cancelar Cita", no se cancela inmediatamente.
    *   Debe mostrarse un input (o cambiar de 'step' en el modal) para pedir un **motivo de cancelación** (`cancelReason`). Este campo es obligatorio.
    *   Al confirmar, llamar a la mutación de tRPC que actualizará el estado a `CANCELLED`, guardará la razón, y a su vez ejecutará `cancelCalComBooking(calComEventId, cancelReason)` usando la función existente en `src/lib/calcom.ts`.

## Paso 5: Actualización del Router tRPC (`src/server/api/routers/appointment.ts`)

1.  Actualizar los esquemas de entrada de `getAll`, `create` y `update` para usar los nuevos estados y pagos.
2.  **Cancelación Segura:**
    En el método `update`, verificar:
    ```typescript
    if (input.status === "CANCELLED" && existing.status !== "CANCELLED") {
      if (!input.cancelReason) throw new Error("La razón de cancelación es obligatoria");
      
      if (existing.calComEventId) {
        await cancelCalComBooking(existing.calComEventId, input.cancelReason);
      }
    }
    ```
3.  Asegurar que la actualización del Medio de Pago sea independiente de la actualización del Estado de la Cita. Para esto, puedes crear mutaciones separadas (`updateStatus` y `updatePaymentStatus`) o permitir que `update` reciba campos opcionales (`Partial`).

## Reglas de Arquitectura y Estilo a Respetar

*   **Mobile-First:** La vista `/admin/citas` debe usar Cards para resoluciones móviles y Tabla solo en Desktop.
*   **Diseño Premium:** Utiliza los colores de la marca Estudio Pélvico, componentes de Shadcn/UI (Dialog, Button, Badge) e íconos de Lucide React.
*   **Zero Errors:** Verifica que no queden errores de TypeScript (`npm run typecheck`). Si se modifica el esquema de Prisma, asegúrate de correr `npx prisma generate` antes de evaluar los tipos.
*   **Webhooks:** Asegúrate de que tu nueva estructura no rompa la inserción automática desde Cal.com. El webhook (`/api/webhooks/calcom/route.ts`) deberá asignar por defecto `status: "BOOKED"` y `paymentStatus: "PENDING"`.

## Resumen de Tareas para la IA Ejecutora

1. Modificar `schema.prisma` -> `npx prisma db push` -> `npx prisma generate`.
2. Actualizar `src/server/api/routers/appointment.ts` (inputs de zod y lógica de BD).
3. Actualizar `src/app/api/webhooks/calcom/route.ts` con los nuevos enums.
4. Crear / Modificar `AppointmentDetailModal.tsx`.
5. Refactorizar `CitasClient.tsx` (Columnas, filas clickeables, modal de notas, eliminación de edición inline).
6. Verificar integridad (Build y Lint).
