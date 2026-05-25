# Plan de Implementación Unificado: T3 Stack
## Estudio Pélvico Camila Ortiz — Sitio Público + Panel Admin

---

## 1. Arquitectura General: Monolito Next.js (Opción A Confirmada)

**Decisiones tomadas:**
- ✅ **Monolito unificado** (mismo repositorio y despliegue)
- ✅ **Sin tabla de Testimonios** en la BD — se mostrarán reseñas de Google mediante widget embebido
- ✅ **Sanity CMS** para gestión de contenido público (servicios, blog, galería)
- ✅ **Cal.com** para reservas de citas (ya integrado externamente)
- ✅ **agendaadmin-pro** migrado como el panel `/admin` de la aplicación unificada

```mermaid
graph TD
    Public[Visitante Web\nEstudio Pélvico] -->|Consulta contenido| NextJS[Next.js App Router]
    NextJS -->|GROQ queries| Sanity[Sanity CMS\nBlog · Servicios · Galería]
    NextJS -->|Embed iframe/link| CalCom[Cal.com\nReservas de Citas]
    NextJS -->|Widget| GoogleReviews[Google Reviews\nWidget Embebido]

    Admin[Camila — Kinesióloga\nPanel Admin /admin] -->|Auth | NextAuth[NextAuth.js\nCredenciales]
    NextAuth --> ProtectedRoutes[Rutas Protegidas /admin]
    ProtectedRoutes -->|tRPC protectedProcedure| TRPC[tRPC API]
    TRPC -->|Prisma ORM| DB[(PostgreSQL\nClientes · Citas · Pagos)]
    ProtectedRoutes -->|Sanity Client| Sanity
    ProtectedRoutes -->|Cal.com API| CalCom
```

---

## 2. Análisis del agendaadmin-pro (Proyecto Fuente)

El proyecto **agendaadmin-pro** es una SPA de React + Vite con un servidor Express que sirve como backend mock. Sus componentes serán migrados directamente al directorio `/admin` del nuevo proyecto Next.js.

### Componentes identificados a migrar:

| Componente actual | Ruta en T3 | Descripción |
|---|---|---|
| `App.tsx` (shell) | `app/admin/layout.tsx` | Sidebar, header, navegación, dark mode |
| `Dashboard.tsx` | `app/admin/page.tsx` | KPIs: ingresos, citas, clientes, retención + gráfico de barras (Recharts) |
| `CalendarView.tsx` | `app/admin/agenda/page.tsx` | Calendario semanal, navegación por semana, renderizado de citas |
| `ClientList.tsx` | `app/admin/pacientes/page.tsx` | Tabla de pacientes con búsqueda, paginación y acciones |
| `server.ts` (mock API) | `server/api/routers/` | Los endpoints Express se convierten en **procedimientos tRPC** |
| `types.ts` | `types/index.ts` | Interfaces de TypeScript compartidas (Client, Appointment, DashboardStats) |

### Nuevas pantallas a crear en `/admin`:

| Pantalla | Descripción |
|---|---|
| `admin/contenido/servicios` | CRUD de servicios via Sanity Client |
| `admin/contenido/blog` | Editor de posts via Sanity Client |
| `admin/contenido/galeria` | Gestión de galería "Antes y Después" via Sanity |
| `admin/configuracion` | Integración Cal.com (API key), configuración WhatsApp, etc. |

---

## 3. Sanity CMS — Rol en la Arquitectura

Sanity gestiona **todo el contenido público** del sitio. No hay datos sensibles de pacientes ni autenticación. Camila puede editarlo desde `studio.sanity.io` o desde la ruta embebida `/admin/contenido`.

### Schemas de Sanity a Definir:

```javascript
// schema: service.js
{
  name: 'service',
  type: 'document',
  fields: [
    { name: 'name', type: 'string', title: 'Nombre del Servicio' },
    { name: 'category', type: 'string', title: 'Categoría',
      options: { list: ['Atenciones Pélvicas', 'Embarazo', 'Cicatrices-Masajes', 'Respiratorio', 'Empresas'] }
    },
    { name: 'price', type: 'string', title: 'Precio (ej: $30.000)' },
    { name: 'duration', type: 'string', title: 'Duración (ej: 40 min)' },
    { name: 'details', type: 'text', title: 'Descripción detallada' },
    { name: 'order', type: 'number', title: 'Orden de aparición' },
  ]
}

// schema: post.js (Blog)
{
  name: 'post',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug', options: { source: 'title' } },
    { name: 'category', type: 'string' }, // "CONSEJOS", "MATERNIDAD"
    { name: 'mainImage', type: 'image', options: { hotspot: true } },
    { name: 'description', type: 'text' },
    { name: 'body', type: 'array', of: [{ type: 'block' }] }, // Portable Text
    { name: 'publishedAt', type: 'datetime' },
  ]
}

// schema: galleryItem.js (Antes y Después)
{
  name: 'galleryItem',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'beforeImage', type: 'image' },
    { name: 'afterImage', type: 'image' },
    { name: 'description', type: 'text' },
    { name: 'order', type: 'number' },
  ]
}
```

---

## 4. Modelo de Base de Datos — Prisma ORM

La base de datos PostgreSQL almacena **datos operacionales** (pacientes y citas clínicas, no contenido de marketing).

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Administradores del sistema (solo Camila en la práctica)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Pacientes / Clientes
model Patient {
  id           String        @id @default(cuid())
  name         String
  email        String?       @unique
  phone        String?
  rut          String?       @unique // RUT chileno
  birthDate    DateTime?
  notes        String?       @db.Text // Notas clínicas privadas
  status       String        @default("Active") // "Active" | "Inactive"
  lastVisit    DateTime?
  appointments Appointment[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

// Citas / Atenciones
model Appointment {
  id              String    @id @default(cuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)
  title           String    // Ej: "Evaluación Pélvica"
  serviceCategory String?   // Categoría del servicio
  date            DateTime
  durationMinutes Int       @default(60)
  status          String    @default("Confirmed") // "Confirmed" | "Pending" | "Cancelled"
  paymentStatus   String    @default("Unpaid")    // "Paid" | "Unpaid" | "Partial"
  amountPaid      Float?
  calComEventId   String?   @unique // ID de sincronización con Cal.com
  notes           String?   @db.Text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

> [!NOTE]
> Se eliminó el modelo `Testimonial` del diseño anterior. Las reseñas se mostrarán mediante el **widget de Google Reviews** (Google Places API embebida).

> [!IMPORTANT]
> `calComEventId` permite sincronizar las citas entre Cal.com y la base de datos interna, manteniendo ambos sistemas en sync. En el proyecto Petitsalon ya tienes experiencia con esta integración vía webhooks.

---

## 5. Integración Cal.com

Cal.com gestiona la **disponibilidad y el booking público**. El flujo de datos es:

1. **Paciente** reserva una cita en `cal.com/camila-ortiz` (o en el embed de la web)
2. Cal.com emite un **webhook** `BOOKING_CREATED`
3. Un endpoint de Next.js (`/api/webhooks/calcom`) recibe el webhook, valida la firma HMAC, y **crea/actualiza** el registro en la BD usando Prisma.
4. El **Panel Admin** (`/admin/agenda`) muestra las citas sincronizadas en tiempo real.

```typescript
// app/api/webhooks/calcom/route.ts
import { prisma } from "@/server/db";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("X-Cal-Signature-256");
  
  // Validación HMAC (mismo patrón que el proyecto Petitsalon)
  const expectedSig = crypto
    .createHmac("sha256", process.env.CALCOM_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  
  if (`sha256=${expectedSig}` !== signature) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(body);
  
  if (payload.triggerEvent === "BOOKING_CREATED") {
    const attendee = payload.payload.attendees?.[0];
    
    // Buscar o crear paciente por email
    const patient = await prisma.patient.upsert({
      where: { email: attendee.email },
      update: { lastVisit: new Date(payload.payload.startTime) },
      create: {
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone ?? null,
      },
    });

    // Crear o actualizar la cita
    await prisma.appointment.upsert({
      where: { calComEventId: String(payload.payload.uid) },
      update: { status: "Confirmed" },
      create: {
        patientId: patient.id,
        calComEventId: String(payload.payload.uid),
        title: payload.payload.title,
        date: new Date(payload.payload.startTime),
        durationMinutes: payload.payload.eventDuration ?? 60,
        status: "Confirmed",
        paymentStatus: "Unpaid",
      },
    });
  }

  return new Response("OK", { status: 200 });
}
```

---

## 6. Estructura de Carpetas del Proyecto T3 Unificado

```bash
estudio-pelvico-camila-ortiz/        # ← El proyecto ACTUAL se convierte en la base
├── prisma/
│   └── schema.prisma
├── sanity/                           # ← Configuración de Sanity Studio (incrustado)
│   ├── schemaTypes/
│   │   ├── service.ts
│   │   ├── post.ts
│   │   └── galleryItem.ts
│   └── sanity.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (fuentes, globals.css)
│   │   ├── page.tsx                  # Página pública principal ← componentes actuales
│   │   ├── blog/
│   │   │   ├── page.tsx              # Listado de posts (data de Sanity)
│   │   │   └── [slug]/page.tsx       # Artículo individual (Portable Text)
│   │   ├── login/
│   │   │   └── page.tsx              # Formulario login admin
│   │   ├── admin/                    # ← agendaadmin-pro migrado aquí
│   │   │   ├── layout.tsx            # Shell: sidebar + header (de agendaadmin-pro App.tsx)
│   │   │   ├── page.tsx              # Dashboard con KPIs (de Dashboard.tsx)
│   │   │   ├── agenda/
│   │   │   │   └── page.tsx          # Calendario semanal (de CalendarView.tsx)
│   │   │   ├── pacientes/
│   │   │   │   └── page.tsx          # Lista de pacientes (de ClientList.tsx)
│   │   │   └── contenido/
│   │   │       ├── servicios/page.tsx # Gestión de servicios via Sanity
│   │   │       ├── blog/page.tsx      # Editor de posts via Sanity
│   │   │       └── galeria/page.tsx   # Gestión galería via Sanity
│   │   ├── studio/
│   │   │   └── [[...tool]]/page.tsx  # Sanity Studio embebido (opcional)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── trpc/[trpc]/route.ts
│   │       └── webhooks/
│   │           └── calcom/route.ts   # Webhook de Cal.com
│   ├── components/                   # ← Componentes actuales del sitio público
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Services.tsx              # Ahora consume data de Sanity
│   │   ├── Gallery.tsx               # Ahora consume data de Sanity
│   │   ├── Blog.tsx                  # Ahora consume data de Sanity
│   │   ├── Reviews.tsx               # Widget de Google Reviews
│   │   ├── Footer.tsx
│   │   └── Logo.tsx
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts
│   │   │   └── routers/
│   │   │       ├── patients.ts       # ← Migra /api/clients de agendaadmin-pro
│   │   │       ├── appointments.ts   # ← Migra /api/appointments de agendaadmin-pro
│   │   │       └── dashboard.ts      # ← Migra /api/dashboard de agendaadmin-pro
│   │   ├── auth.ts
│   │   └── db.ts
│   ├── lib/
│   │   └── sanity.ts                 # Cliente de Sanity para queries GROQ
│   └── styles/
│       └── globals.css               # ← index.css actual con @theme de colores
├── middleware.ts                     # Protege rutas /admin/*
├── next.config.ts
├── .env.local
└── package.json
```

---

## 7. Variables de Entorno Necesarias

```bash
# .env.local

# === Base de Datos ===
DATABASE_URL="postgresql://user:password@localhost:5432/estudio_pelvico"

# === NextAuth.js ===
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera_uno_con_openssl_rand_base64_32"

# === Sanity CMS ===
NEXT_PUBLIC_SANITY_PROJECT_ID="tu_project_id"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_TOKEN="sk..."  # Read+Write token para las mutaciones desde el admin

# === Cal.com ===
CALCOM_WEBHOOK_SECRET="tu_secret_del_webhook"
CALCOM_API_KEY="cal_live_..."  # Para operaciones desde el panel admin

# === Google Reviews (Places API) ===
NEXT_PUBLIC_GOOGLE_PLACE_ID="ChIJ..."
```

---

## 8. Pasos de Implementación (Orden Sugerido)

### Fase 1 — Cimientos del Proyecto T3
1. Inicializar `create-t3-app@latest` eligiendo: **Next.js App Router + Tailwind CSS + Prisma + tRPC + NextAuth.js**
2. Copiar el `@theme` de colores del `index.css` actual a `globals.css`
3. Configurar `prisma/schema.prisma` con los modelos `User`, `Patient` y `Appointment`
4. Ejecutar `npx prisma migrate dev --name init`
5. Configurar `middleware.ts` para proteger `/admin`

### Fase 2 — Migrar el Sitio Público
6. Mover los componentes actuales (`Navbar`, `Hero`, `About`, `Services`, `Gallery`, `Blog`, `Footer`) a `src/components/`
7. Crear `app/page.tsx` ensamblando los componentes del sitio público
8. Configurar el cliente Sanity en `src/lib/sanity.ts`
9. Reemplazar los arrays hardcodeados en `Services.tsx` y `Blog.tsx` con queries GROQ a Sanity
10. Implementar `app/blog/[slug]/page.tsx` con renderizado de Portable Text

### Fase 3 — Migrar el Panel Admin (agendaadmin-pro)
11. Crear `app/admin/layout.tsx` copiando el shell de sidebar y header de `agendaadmin-pro/App.tsx`
12. Crear los routers tRPC: `dashboard.ts`, `patients.ts`, `appointments.ts` (adaptando los endpoints Express mock del `server.ts` de agendaadmin-pro)
13. Migrar `Dashboard.tsx` → `app/admin/page.tsx` (reemplazando `fetch('/api/...')` con `api.dashboard.getStats.useQuery()`)
14. Migrar `CalendarView.tsx` → `app/admin/agenda/page.tsx`
15. Migrar `ClientList.tsx` → `app/admin/pacientes/page.tsx` (renombrando "Clients" por "Pacientes")

### Fase 4 — Integraciones Externas
16. Implementar webhook de Cal.com en `app/api/webhooks/calcom/route.ts`
17. Agregar embed de Cal.com en el botón "Agendar Hora" del sitio público
18. Integrar widget de Google Reviews en `components/Reviews.tsx`
19. Opcionalmente embeber Sanity Studio en `app/studio/[[...tool]]/page.tsx`

---

## 9. Resumen Visual de Integraciones

| Servicio | Rol | Punto de Contacto |
|---|---|---|
| **Sanity CMS** | Contenido público (servicios, blog, galería) | GROQ desde Server Components + Studio embebido |
| **Cal.com** | Reservas y disponibilidad | Embed iframe en sitio + webhook → Prisma |
| **Google Reviews** | Testimonios públicos | Widget Places API embebido en `Reviews.tsx` |
| **PostgreSQL + Prisma** | Datos operacionales (pacientes, citas) | Solo accesible desde el servidor (tRPC) |
| **NextAuth.js** | Autenticación del admin | Sesión JWT, middleware de protección de rutas |
| **Recharts** | Gráficos del dashboard | Se mantiene igual que en agendaadmin-pro |

> [!IMPORTANT]
> Al reutilizar el webhook pattern de Cal.com, puedes aprovechar el conocimiento adquirido en el proyecto **Petitsalon** (conversación `62e65eac`), donde ya resolviste problemas de sincronización HMAC, custom fields y `upsert` de base de datos con Cal.com.
