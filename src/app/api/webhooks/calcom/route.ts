import { db } from "~/server/db";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("x-cal-signature-256");
    
    const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET;

    const payload = JSON.parse(body);

    console.log("[Cal.com Webhook] Received:", {
      trigger: payload?.triggerEvent,
      headers: Object.fromEntries(headersList.entries()),
      bodyPreview: body.substring(0, 200),
    });
    
    // Signature verification (only if secret is configured)
    if (webhookSecret) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret.trim())
        .update(body)
        .digest("hex");
      
      console.log("[Cal.com Webhook] Signature check:", {
        received: signature,
        expected: expectedSig,
        match: signature === expectedSig,
      });
      
      if (signature !== expectedSig) {
        console.error("[Cal.com Webhook] Signature mismatch! Check CALCOM_WEBHOOK_SECRET");
        return new Response("Invalid signature", { status: 401 });
      }
    }
    
    if (payload.triggerEvent === "BOOKING_CREATED" || payload.triggerEvent === "BOOKING_RESCHEDULED") {
      const booking = payload.payload;
      
      if (payload.triggerEvent === "BOOKING_RESCHEDULED") {
        const newDate = new Date(booking.startTime);
        
        // Verificar si la cita ya tiene esa fecha (para evitar loop si el admin inició el reagendamiento)
        const existingAppt = await db.appointment.findUnique({
          where: { calComEventId: String(booking.uid) }
        });
        
        if (existingAppt && Math.abs(existingAppt.date.getTime() - newDate.getTime()) < 60000) {
          // La fecha ya coincide (diferencia < 1 minuto), el cambio fue iniciado desde nuestra app
          console.log("[Cal.com Webhook] Reschedule already reflected locally, skipping DB update");
          return new Response("Already synced", { status: 200 });
        }
      }

      const attendee = booking.attendees?.[0];
      
      if (!attendee) {
        return new Response("Missing attendee", { status: 400 });
      }

      // Split Cal.com full name into firstName and lastName
      const fullName = attendee.name || "";
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "Paciente";
      const lastName = nameParts.slice(1).join(" ") || "Sin Apellido";

      // Normalize phone
      const cleanPhone = (phone: string): string => {
        let clean = phone.replace(/[^\d+]/g, '');
        if (clean.length === 9 && clean.startsWith('9')) {
          clean = '+56' + clean;
        } else if (clean.length === 11 && clean.startsWith('569')) {
          clean = '+' + clean;
        } else if (clean.length === 8) {
          clean = '+569' + clean;
        }
        if (/^\+569\d{8}$/.test(clean)) return clean;
        if (/^\+\d{10,15}$/.test(clean)) return clean;
        return clean || "+56900000000";
      };

      let rawPhone = attendee.phone || booking.responses?.phone?.value || booking.responses?.telefono?.value;
      const patientPhone = rawPhone ? cleanPhone(String(rawPhone)) : "+56900000000";

      // 1. Buscar paciente existente por email
      let patient = attendee.email 
        ? await db.patient.findUnique({ where: { email: attendee.email } })
        : null;

      // 2. Si no se encontró por email, buscar por teléfono normalizado
      if (!patient && attendee.phone) {
        patient = await db.patient.findFirst({ where: { phone: patientPhone } });
      }

      // 3. Si no existe, crear el paciente nuevo
      if (!patient) {
        patient = await db.patient.create({
          data: {
            firstName,
            lastName,
            email: attendee.email || null,
            phone: patientPhone,
          },
        });
      } else {
        // 4. Si existe, actualizar datos si cambiaron (no sobreescribir si ya tenía info)
        await db.patient.update({
          where: { id: patient.id },
          data: {
            // Solo actualizar email si el paciente no tenía uno
            ...(patient.email ? {} : { email: attendee.email || null }),
          },
        });
      }

      // Buscar el service asociado a este event type de Cal.com
      let serviceId: string | null = null;
      if (booking.eventTypeId) {
        const service = await db.service.findFirst({
          where: { calComEventTypeId: Number(booking.eventTypeId) }
        });
        serviceId = service?.id || null;
      }

      // Create or update the appointment
      try {
        const bookingIdVal = booking.bookingId ? String(booking.bookingId) : (booking.id ? String(booking.id) : null);
        
        const existingAppt = await db.appointment.findUnique({
          where: { calComEventId: String(booking.uid) },
        });

        if (existingAppt) {
          await db.appointment.update({
            where: { id: existingAppt.id },
            data: {
              date: new Date(booking.startTime),
              durationMinutes: booking.eventDuration || booking.length || existingAppt.durationMinutes,
              ...(serviceId ? { 
                serviceId, 
                title: booking.title || booking.eventType?.title || "Cita de Kinesiología" 
              } : {}),
              notes: booking.responses?.notes?.value || existingAppt.notes,
              ...(bookingIdVal ? { calComBookingId: bookingIdVal } : {}),
            },
          });
        } else {
          await db.appointment.create({
            data: {
              patientId: patient.id,
              calComEventId: String(booking.uid),
              calComBookingId: bookingIdVal,
              title: booking.title || booking.eventType?.title || "Cita de Kinesiología",
              date: new Date(booking.startTime),
              durationMinutes: booking.eventDuration || booking.length || 60,
              status: "BOOKED",
              serviceId,
              notes: booking.responses?.notes?.value || null,
            },
          });
        }
      } catch (err) {
        console.error("UPSERT ERROR:", err);
        throw err;
      }
    } else if (payload.triggerEvent === "BOOKING_CANCELLED") {
      const booking = payload.payload;
      
      // Update appointment status to Cancelled
      try {
        await db.appointment.update({
          where: { calComEventId: String(booking.uid) },
          data: {
            status: "CANCELLED",
            cancelReason: "Cancelada desde Cal.com",
          },
        });
      } catch (err) {
        console.error("UPDATE ERROR in CANCELLED:", err);
        throw err;
      }
    }

    console.log("[Cal.com Webhook] Successfully processed:", payload.triggerEvent);
    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing Cal.com webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
