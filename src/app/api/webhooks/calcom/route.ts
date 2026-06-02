import { db } from "~/server/db";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("x-cal-signature-256");
    
    const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET;
    
    // Signature verification (only if secret is configured)
    if (webhookSecret) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      
      if (signature !== expectedSig) {
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    
    if (payload.triggerEvent === "BOOKING_CREATED" || payload.triggerEvent === "BOOKING_RESCHEDULED") {
      const booking = payload.payload;
      const attendee = booking.attendees?.[0];
      
      if (!attendee) {
        return new Response("Missing attendee", { status: 400 });
      }

      // Split Cal.com full name into firstName and lastName
      const fullName = attendee.name || "";
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "Paciente";
      const lastName = nameParts.slice(1).join(" ") || "Sin Apellido";

      // Find or create patient by email (upsert)
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

      const patientPhone = attendee.phone ? cleanPhone(attendee.phone) : "+56900000000";

      const patient = await db.patient.upsert({
        where: { email: attendee.email },
        update: { 
          firstName,
          lastName,
          phone: patientPhone,
        },
        create: {
          firstName,
          lastName,
          email: attendee.email,
          phone: patientPhone,
        },
      });

      // Create or update the appointment
      await db.appointment.upsert({
        where: { calComEventId: String(booking.uid) },
        update: { 
          status: "BOOKED",
          date: new Date(booking.startTime),
          durationMinutes: booking.eventDuration || 60,
          title: booking.title || "Cita de Kinesiología",
        },
        create: {
          patientId: patient.id,
          calComEventId: String(booking.uid),
          calComBookingId: String(booking.id || ""),
          title: booking.title || "Cita de Kinesiología",
          date: new Date(booking.startTime),
          durationMinutes: booking.eventDuration || 60,
          status: "BOOKED",
        },
      });
    } else if (payload.triggerEvent === "BOOKING_CANCELLED") {
      const booking = payload.payload;
      
      // Update appointment status to Cancelled
      await db.appointment.update({
        where: { calComEventId: String(booking.uid) },
        data: {
          status: "CANCELLED",
          cancelReason: "Cancelada desde Cal.com",
        },
      });
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing Cal.com webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
