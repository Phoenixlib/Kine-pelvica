# Manual del Administrador: Estudio Pélvico Camila Ortiz

Este documento es una guía integral que describe todas las funcionalidades del panel de administración del **Estudio Pélvico Camila Ortiz**. Está diseñado para brindar autonomía en la gestión diaria, configuración del sitio, control de pacientes y sincronización de horarios.

---

## 1. Inicio (Dashboard y Resumen de Actividad)
El Dashboard es la pantalla principal a la que se accede al ingresar al sistema. Está pensado para dar un rápido vistazo al estado de la clínica.
* **Métricas Rápidas:**
  * **Mensajes Pendientes:** Muestra la cantidad de correos o contactos sin responder en el Buzón.
  * **Citas Agendadas Hoy:** Conteo en tiempo real de los pacientes que asisten en el día.
  * **Artículos Publicados:** Total de publicaciones subidas al Blog.
  * **Tasa de Asistencia:** Porcentaje de asistencia de los últimos 30 días.
* **Gráfico de Servicios:** Un desglose visual (gráfico circular) de los servicios más solicitados recientemente, útil para analizar tendencias.
* **Próximas Citas:** Un listado simplificado con las próximas atenciones, indicando nombre del paciente, servicio y horario.

---

## 2. Agenda y Bloqueos de Horario

El módulo de Agenda integra la vista local con **Cal.com** mediante un sistema híbrido que permite conocer los espacios libres y gestionarlos directamente.

### A. Tipos de Bloqueos
* **Bloqueo Local:** Franja gris creada desde la app. Se sincroniza hacia Cal.com.
* **Bloqueo Virtual:** Franja gris originada directamente desde el panel de Cal.com.
* **Horario No Laboral:** Área sombreada con rayas diagonales. Evita que los pacientes agenden, pero le permite a la administradora forzar un "Sobrecupo".

### B. Crear un Bloqueo
1. En la grilla, haga clic sobre la celda que desea bloquear.
2. Seleccione **"Bloquear Horario"**.
3. Elija la duración o marque "Todo el día", y agregue un motivo (ej. Médico, Congreso).
4. Guarde los cambios. Esto cerrará el horario para las reservas web inmediatamente.

### C. Eliminar un Bloqueo
> [!IMPORTANT]
> **REGLA DE ORO:** Utilice la **aplicación local** como la Fuente Única de Verdad.
Para borrar un bloqueo, haga clic sobre su franja gris en la Agenda local y pulse **"Eliminar Bloqueo"**. El sistema se encargará de liberar el horario en Cal.com y recalcular su disponibilidad.

---

## 3. Citas y Atenciones

El panel de **Citas** centraliza el historial de todas las interacciones clínicas.
* **Listado Histórico y Futuro:** Visualice cada cita agendada en una tabla que indica fecha, hora, nombre del paciente, servicio y estado (Confirmada, Cancelada, etc).
* **Búsqueda Inteligente:** Filtre rápidamente la lista ingresando el nombre de la paciente.
* **Gestión Rápida:** Al hacer clic sobre cualquier cita, es posible ver los detalles, acceder a la ficha del paciente, e incluso gestionar cancelaciones o reprogramaciones.

---

## 4. Pacientes (Directorio y Fichas)

Aquí se encuentra el directorio de quienes han agendado o asistido a la consulta.
* **Directorio Ordenado:** El listado se ordena automáticamente de manera alfabética (por apellido), con un buscador inmediato para encontrar registros históricos.
* **Fichas Individuales:** Al acceder a un perfil, visualizará los datos de contacto del paciente (teléfono, correo) y el listado completo de todas sus atenciones pasadas y agendadas a futuro.

---

## 5. Servicios

Módulo destinado a listar y controlar la oferta terapéutica del Estudio Pélvico.
* Permite observar las evaluaciones, sesiones de kinesiología y tratamientos ofrecidos.
* Muestra el precio, la duración y la integración asociada a la agenda, asegurando que la vitrina al público sea coherente con lo agendable.

---

## 6. Buzón de Comunidad

Este panel captura los mensajes de contacto enviados por las usuarias desde la página web (la sección "Comunidad").
* **Seguimiento Ordenado:** Todo mensaje nuevo aparecerá como "No Leído" y mostrará una alerta en el Dashboard.
* **Control de Lectura:** Una vez gestionado, puede ser marcado como "Leído" presionando el ícono correspondiente, manteniendo así su bandeja ordenada y asegurándose de responder a todas las pacientes.

---

## 7. Galería de Imágenes

Un módulo para renovar visualmente la página web principal:
* Permite cargar, visualizar y eliminar fotografías de alta calidad (box de atención, equipos, fachada).
* Todas las fotos aquí administradas se propagarán dinámicamente hacia el carrusel de imágenes "Instalaciones" que las usuarias ven en el Landing.

---

## 8. Gestión de Contenido del Sitio y Datos Bancarios

Esta sección permite la autonomía total sobre los textos informativos clave de la página, sin requerir asistencia técnica.

### A. Modificación de Datos de Transferencia (Reserva Exitosa)
Al finalizar su reserva, se le muestra a la usuaria un modal que incluye los datos de pago y un botón rápido para copiarlos. Para editarlos:
1. Diríjase a **"Datos de Transferencia"**.
2. Modifique Nombre, RUT, Banco, Tipo de Cuenta, Nº Cuenta y Email.
3. Pulse **"Guardar Cambios"**. Las modificaciones entrarán en vigencia de inmediato.

### B. Modificación de Biografía y Redes
* **Quién Soy:** Actualice su título profesional, biografía principal y reemplace fácilmente su foto de perfil.
* **Redes y Contacto:** Modifique el número de WhatsApp, Instagram, Facebook y Email de contacto general. Actualiza todos los botones web automáticamente.
* **Cómo Llegar:** Ingrese su nueva dirección física. La aplicación generará automáticamente un mapa interactivo preciso de Google Maps.

---

## 9. Blog (Artículos y Novedades)

El blog cuenta con su propio gestor de contenidos externo (**Sanity**), optimizado para crear artículos enriquecidos (textos amplios, fotografías clínicas como cicatrices o anatomía de piso pélvico, negritas, links, etc).
* Desde el submenú de Blog de la administración, la usuaria es redirigida al portal CMS para redactar los artículos, los cuales se publican al instante en la sección "/blog" de la página web del estudio, potenciando la divulgación educativa de manera rápida y sencilla.
