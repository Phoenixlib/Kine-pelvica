# Casos de Prueba Manuales - Agenda Clínica

A continuación se detallan los flujos actualizados para validar el correcto funcionamiento de las nuevas características de la Agenda.

---

## 1. Crear Cita Manual (Flujo Integrado)
**Objetivo:** Validar que al hacer clic en un espacio vacío se pueda agendar una cita rellenando fecha y hora automáticamente, con opción de buscar o crear un paciente en el mismo modal.

### Escenario A: Con Paciente Existente
**Pasos:**
1. Navegar al panel de administración y entrar a **Agenda**.
2. Hacer clic izquierdo en un bloque horario en blanco (ej. Viernes a las 13:00) en el día deseado.
3. En el menú contextual flotante que aparece, seleccionar **"Agendar Cita"**.
4. Validar que la fecha y la hora (ej. `13:00`) se encuentren pre-rellenadas en los campos del modal.
5. En el campo de búsqueda del paciente, escribir el nombre de un paciente existente.
6. Seleccionar el paciente de la lista desplegable de resultados.
7. Elegir un servicio del menú desplegable "Servicios" (ej. Kinesiología de Suelo Pélvico).
8. Hacer clic en **"Guardar Reserva"**.

**Resultado Esperado:** 
El modal se cierra, la grilla se actualiza y la cita aparece inmediatamente renderizada en el calendario como un bloque de color en el horario seleccionado.

---

### Escenario B: Creando un Paciente Nuevo
**Pasos:**
1. Hacer clic izquierdo en otro bloque horario en blanco de la agenda y seleccionar **"Agendar Cita"**.
2. En la sección "Paciente", hacer clic en el botón de la esquina superior derecha **"+ Agregar paciente"**.
3. Rellenar los campos requeridos del nuevo paciente:
   - Nombre (ej. María)
   - Apellido (ej. González)
   - Teléfono (ej. +56912345678)
   - Email opcional (ej. maria@prueba.com)
4. Seleccionar un servicio.
5. Hacer clic en **"Guardar Reserva"**.

**Resultado Esperado:**
El sistema crea primero al paciente en la base de datos, luego crea la cita asignada a ese nuevo paciente, el modal se cierra y la cita se renderiza de inmediato.

---

## 2. Detección de Choque Horario (Traslape de Citas)
**Objetivo:** Validar que el sistema alerte al administrador cuando una nueva cita interfiera con una ya agendada.

**Pasos:**
1. Identificar una cita existente en la agenda (ej. Lunes de 10:00 a 11:00).
2. Hacer clic en un espacio en blanco y configurar la nueva cita en el mismo día y hora (o en una hora que choque según la duración del servicio seleccionado, ej: 10:30).
3. Seleccionar el servicio.
4. **Verificación:** Observar si aparece un aviso visual de alerta en color rojo/amarillo que dice: *"Precaución: El horario seleccionado choca con otra cita existente."*
5. Hacer clic en **"Guardar Reserva"** (a pesar de la advertencia).

**Resultado Esperado:**
El modal debe mostrar la advertencia de colisión de forma clara. Al presionar "Guardar Reserva", el sistema debe permitir guardar la cita (el choque no bloquea al administrador, solo le advierte).

---

## 3. Bloqueo Rápido de Horarios (Local-First)
**Objetivo:** Validar que el administrador puede bloquear horas directamente en la agenda.

**Pasos:**
1. En la vista de **Agenda**, hacer clic en un bloque horario libre.
2. En el menú contextual, seleccionar **"Bloquear Horario"**.
3. **Verificación:** Validar que se pinte una franja color gris/rayado sobre ese bloque de tiempo con la etiqueta "Bloqueado".
4. Hacer clic sobre el icono de la "X" en la tarjeta del bloqueo para eliminarlo.

**Resultado Esperado:**
El horario se bloquea correctamente y al presionar la "X" el bloqueo se elimina, liberando el horario de inmediato.

---

## 4. Navegación Rápida con Popover de Calendario
**Objetivo:** Validar la navegación de fecha a través del popover en el título.

### Escenario A: Selección de fecha y cambio de mes
1. En la cabecera de la agenda, hacer clic sobre el nombre del mes (ej. "Junio 2026").
2. **Verificación:** Debe abrirse un calendario flotante (popover) justo debajo.
3. Usar las flechas simples (`<` y `>`) para cambiar de mes.
4. Seleccionar un día en el calendario.

**Resultado Esperado:**
El calendario flotante se cierra y la agenda principal salta inmediatamente a la semana correspondiente al día seleccionado.

### Escenario B: Cambio de año rápido
1. Hacer clic sobre el nombre del mes en la cabecera para abrir el popover.
2. Usar los botones de flecha doble (`<<` o `>>`) en las esquinas superiores del popover, o seleccionar directamente el año usando el menú desplegable (dropdown) que aparece junto al nombre del mes.
3. Seleccionar un día.

**Resultado Esperado:**
La agenda viaja con éxito al año seleccionado y se reposiciona en la semana correspondiente.

---

## 5. Modo Pantalla Completa Aislado
**Objetivo:** Validar que el botón de pantalla completa maximice solo el calendario y proporcione una opción de retorno clara.

**Pasos:**
1. En la esquina superior derecha de la agenda, hacer clic en el botón de **Pantalla Completa** (icono de expandir).
2. **Verificación:** El contenedor de la agenda debe ocupar toda la pantalla, eliminando los bordes redondeados y ocultando los menús externos del dashboard.
3. Observar el botón de pantalla completa en la esquina superior derecha. Ahora debe ser de color rojo, mostrar una "X" y decir **"Volver"**.
4. Hacer clic en **"Volver"** o presionar la tecla `Esc` de tu teclado.

**Resultado Esperado:**
La agenda regresa a su tamaño y posición normal en el panel de administración de manera fluida.
