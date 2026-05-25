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

      // Find or create patient by email (upsert)
      const patient = await db.patient.upsert({
        where: { email: attendee.email },
        update: { 
          name: attendee.name,
          phone: attendee.phone || null,
          lastVisit: new Date(booking.startTime)
        },
        create: {
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone || null,
          lastVisit: new Date(booking.startTime),
          status: "Active",
        },
      });

      // Create or update the appointment
      await db.appointment.upsert({
        where: { calComEventId: String(booking.uid) },
        update: { 
          status: "Confirmed",
          date: new Date(booking.startTime),
          durationMinutes: booking.eventDuration || 60,
          title: booking.title || "Cita de Kinesiología",
        },
        create: {
          patientId: patient.id,
          calComEventId: String(booking.uid),
          title: booking.title || "Cita de Kinesiología",
          date: new Date(booking.startTime),
          durationMinutes: booking.eventDuration || 60,
          status: "Confirmed",
          paymentStatus: "Unpaid",
          amountPaid: 30000, // default evaluation rate
        },
      });
    } else if (payload.triggerEvent === "BOOKING_CANCELLED") {
      const booking = payload.payload;
      
      // Update appointment status to Cancelled
      await db.appointment.update({
        where: { calComEventId: String(booking.uid) },
        data: {
          status: "Cancelled",
        },
      });
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing Cal.com webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
