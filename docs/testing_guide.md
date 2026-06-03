# Guía de Pruebas de Integraciones y Variables de Entorno

Esta guía detalla el paso a paso para probar las funcionalidades del **Estudio Pélvico Camila Ortiz** asociadas con las credenciales cargadas recientemente en el archivo `.env` (Cloudinary, Cal.com, Base de Datos Neon y Google Places).

---

## 1. Conexión de Base de Datos (Neon PostgreSQL)
* **Objetivo:** Asegurar que la aplicación lee y escribe correctamente en la base de datos de producción/desarrollo en Neon.
* **Pasos para probar:**
  1. Ejecuta el servidor de desarrollo local:
     ```bash
     npm run dev
     ```
  2. Accede al panel administrativo en [http://localhost:3000/admin](http://localhost:3000/admin).
  3. Navega a **Pacientes** (`/admin/pacientes`) y crea un paciente ficticio.
  4. Guarda los datos y verifica que se listen correctamente en la tabla sin retardos.
  5. Opcional: Ejecuta `npm run db:studio` (Prisma Studio) para confirmar que los registros existen en la base de datos física.

---

## 2. Galería de Imágenes y Contenido (Cloudinary)
* **Objetivo:** Validar que la subida directa al navegador con firma criptográfica del servidor hacia Cloudinary funcione, así como la compresión automática en cliente y el borrado de assets.
* **Pasos para probar:**
  1. Inicia sesión en el panel administrativo y navega a **Galería** (`/admin/galeria`).
  2. Intenta subir una foto pesada (>2MB). El sistema debería comprimirla en el cliente usando HTML5 Canvas antes de enviarla a Cloudinary.
  3. Confirma que la subida es exitosa y la imagen aparece en la cuadrícula de la galería.
  4. Entra a tu consola de [Cloudinary](https://cloudinary.com) y navega a la carpeta `estudiopelvico/galeria/` para verificar que el archivo está almacenado allí.
  5. Elimina la foto en el panel administrativo y asegúrate de que desaparece del panel y del almacenamiento de Cloudinary (ejecutando silenciosamente el borrado).

---

## 3. Sincronización Automática de Servicios (Cal.com API)
* **Objetivo:** Probar que la creación, edición y eliminación de servicios clínicos locales en Prisma se reflejen en los tipos de eventos (*Event Types*) en Cal.com.
* **Pasos para probar:**
  1. Ve a la sección **Servicios** (`/admin/servicios`).
  2. Crea un nuevo servicio (por ejemplo, `Evaluación Integral Kinesiología`, precio: `$45000`, duración: `60` minutos).
  3. Guarda y verifica en la lista que se le haya asignado automáticamente un `calComBookingUrl` y un ID de tipo de evento en Cal.com.
  4. Entra a tu cuenta en [Cal.com](https://cal.com) y ve al panel de *Event Types*. Comprueba que el nuevo tipo de evento se haya creado con el nombre, duración y slug dinámicos.
  5. Edita el nombre del servicio en el panel local y verifica que en Cal.com se actualice el título del evento.
  6. Elimina el servicio desde tu panel y confirma que desaparece tanto del listado local como de tu cuenta de Cal.com.

---

## 4. Agendamiento y Pacientes Automatizados (Cal.com Webhook)
* **Objetivo:** Validar que cuando un paciente reserva, reprograma o cancela una cita en la página de reservas de Cal.com, la base de datos de Camila Ortiz se actualice automáticamente mediante webhooks.
* **Pasos para probar:**
  1. **Exponer puerto local (Desarrollo):** Si estás probando localmente, expón tu puerto `3000` con `ngrok` o similar:
     ```bash
     ngrok http 3000
     ```
  2. **Configurar Webhook en Cal.com:**
     - Ve a la configuración de Webhooks de Cal.com.
     - Agrega un webhook apuntando a `https://<TU-URL-EXPOSICION>/api/webhooks/calcom`.
     - Introduce el mismo `CALCOM_WEBHOOK_SECRET` que definiste en tu `.env`.
     - Selecciona los disparadores: `BOOKING_CREATED`, `BOOKING_RESCHEDULED` y `BOOKING_CANCELLED`.
  3. **Simular Reserva (BOOKING_CREATED):**
     - Ve al enlace de reservas de Cal.com y agenda una cita ficticia. Usa un nombre y correo electrónico de prueba.
     - Confirma que la terminal local muestra una llamada exitosa a `POST /api/webhooks/calcom` (código HTTP `200`).
     - Entra en `/admin/agenda` y verifica que la cita se ha agendado con estado `BOOKED` y que el paciente fue creado automáticamente en la base de datos.
  4. **Simular Cancelación (BOOKING_CANCELLED):**
     - Cancela la reserva desde Cal.com.
     - Verified que el estado de la cita en `/admin/agenda` o `/admin/citas` cambie automáticamente a `CANCELLED`.

---

## 5. Enlace Dinámico de Reseñas de Google
* **Objetivo:** Asegurar que el botón "Evaluar" del front-end redirija dinámicamente al paciente para escribir una reseña en Google My Business basándose en el `GOOGLE_REVIEW_URL`.
* **Pasos para probar:**
  1. Levanta la aplicación localmente y ve a la página principal (`/`).
  2. Haz scroll hasta la sección de **Testimonios / Qué dicen nuestros pacientes**.
  3. Haz clic en el botón **Evaluar** dentro de la tarjeta de Google My Business.
  4. Comprueba que se abre una nueva pestaña redirigiendo a la URL correcta para escribir la reseña en la ficha de Google.
