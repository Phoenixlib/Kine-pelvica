import { env } from "~/env";

interface CalComCancelResponse {
  status: string;
  data: {
    id: number;
    uid: string;
    status: string;
  };
}

interface CalComRescheduleResponse {
  status: string;
  data: {
    id: number;
    uid: string;
    startTime: string;
    status: string;
  };
}

interface CalComEventTypeResponse {
  status: string;
  data: {
    id: number;
    slug: string;
    bookingUrl?: string; 
  };
}

export interface CalComCreateBookingResponse {
  status: string;
  data: {
    id: number;
    uid: string;
  };
}

/**
 * Creates a booking in Cal.com.
 */
export async function createCalComBooking(
  eventTypeId: number,
  startIso: string,
  attendeeName: string,
  attendeeEmail: string,
  attendeePhone?: string
): Promise<CalComCreateBookingResponse | null> {
  if (!env.CALCOM_API_KEY) {
    console.warn("CALCOM_API_KEY is not set. Skipping Cal.com booking.");
    return null;
  }

  const baseUrl = env.CALCOM_API_URL || "https://api.cal.com/v2";
  const url = `${baseUrl}/bookings`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-08-13",
      },
      body: JSON.stringify({
        start: startIso,
        eventTypeId: eventTypeId,
        attendee: {
          name: attendeeName,
          email: attendeeEmail || `no_email_${Date.now()}@estudiopelvico.cl`,
          timeZone: "America/Santiago",
          language: "es"
        },
        metadata: {
          phone: attendeePhone
        }
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to create booking on Cal.com:`, errText);
      throw new Error(`Cal.com error: ${res.statusText} (${errText})`);
    }

    return await res.json() as CalComCreateBookingResponse;
  } catch (error) {
    console.error(`Error calling Cal.com create booking API:`, error);
    throw error;
  }
}


/**
 * Cancels a booking in Cal.com.
 * @param bookingUid The uid of the booking (stored in our db as calComEventId)
 * @param reason The cancellation reason
 */
export async function cancelCalComBooking(bookingUid: string, reason?: string): Promise<CalComCancelResponse | null> {
  if (!env.CALCOM_API_KEY) {
    console.warn("CALCOM_API_KEY is not set. Skipping Cal.com cancellation.");
    return null;
  }

  const baseUrl = env.CALCOM_API_URL || "https://api.cal.com/v2";
  const url = `${baseUrl}/bookings/${bookingUid}/cancel`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-06-14",
      },
      body: JSON.stringify({
        cancellationReason: reason || "Cancelada desde la aplicación médica",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to cancel booking ${bookingUid} on Cal.com:`, errText);
      throw new Error(`Cal.com error: ${res.statusText} (${errText})`);
    }

    return await res.json() as CalComCancelResponse;
  } catch (error) {
    console.error(`Error calling Cal.com cancel API for booking ${bookingUid}:`, error);
    throw error;
  }
}

/**
 * Reschedules a booking in Cal.com to a new start date/time.
 * @param bookingUid The uid of the booking (stored in our db as calComEventId)
 * @param newDate The new date and time for the booking
 */
export async function rescheduleCalComBooking(bookingUid: string, newDate: Date): Promise<CalComRescheduleResponse | null> {
  if (!env.CALCOM_API_KEY) {
    console.warn("CALCOM_API_KEY is not set. Skipping Cal.com reschedule.");
    return null;
  }

  const baseUrl = env.CALCOM_API_URL || "https://api.cal.com/v2";
  const url = `${baseUrl}/bookings/${bookingUid}/reschedule`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-06-14",
      },
      body: JSON.stringify({
        start: newDate.toISOString(),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to reschedule booking ${bookingUid} on Cal.com:`, errText);
      throw new Error(`Cal.com error: ${res.statusText} (${errText})`);
    }

    return await res.json() as CalComRescheduleResponse;
  } catch (error) {
    console.error(`Error calling Cal.com reschedule API for booking ${bookingUid}:`, error);
    throw error;
  }
}

/**
 * Creates an Event Type on Cal.com.
 */
export async function createCalComEventType(
  title: string,
  lengthInMinutes: number,
  description?: string,
  address?: string
): Promise<CalComEventTypeResponse["data"] | null> {
  if (!env.CALCOM_API_KEY) {
    console.warn("CALCOM_API_KEY not set. Skipping Cal.com event type creation.");
    return null;
  }

  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const baseUrl = env.CALCOM_API_URL || "https://api.cal.com/v2";
  const url = `${baseUrl}/event-types`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-06-14",
      },
      body: JSON.stringify({
        title,
        slug,
        lengthInMinutes,
        description: description || "",
        locations: address ? [{ type: "address", address, public: true }] : undefined,
        disableGuests: true,
        bookingFields: [
          {
            type: "name",
            label: "Nombre completo",
            required: true,
          },
          {
            type: "email",
            label: "Correo electrónico",
            required: true,
          },
          {
            type: "phone",
            slug: "phone",
            label: "Número de teléfono",
            required: true,
          },
          {
            type: "textarea",
            slug: "notes",
            label: "Notas adicionales",
            required: false,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Failed to create event type in Cal.com:", errText);
      throw new Error(`Cal.com error: ${res.statusText} (${errText})`);
    }

    const payload = await res.json() as CalComEventTypeResponse;
    return payload.data;
  } catch (error) {
    console.error("Error calling Cal.com event types API:", error);
    throw error;
  }
}

/**
 * Updates an Event Type on Cal.com.
 */
export async function updateCalComEventType(
  eventTypeId: number,
  title: string,
  lengthInMinutes: number,
  description?: string,
  address?: string
): Promise<CalComEventTypeResponse["data"] | null> {
  if (!env.CALCOM_API_KEY) {
    console.warn("CALCOM_API_KEY not set. Skipping Cal.com event type update.");
    return null;
  }

  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const baseUrl = env.CALCOM_API_URL || "https://api.cal.com/v2";
  const url = `${baseUrl}/event-types/${eventTypeId}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-06-14",
      },
      body: JSON.stringify({
        title,
        slug,
        lengthInMinutes,
        description: description || "",
        locations: address ? [{ type: "address", address, public: true }] : undefined,
        disableGuests: true,
        bookingFields: [
          { type: "name",     label: "Nombre completo",       required: true  },
          { type: "email",    label: "Correo electrónico",    required: true  },
          { type: "phone",    slug: "phone", label: "Número de teléfono",    required: true  },
          { type: "textarea", slug: "notes", label: "Notas adicionales",     required: false },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to update event type ${eventTypeId} in Cal.com:`, errText);
      throw new Error(`Cal.com error: ${res.statusText} (${errText})`);
    }

    const payload = await res.json() as CalComEventTypeResponse;
    return payload.data;
  } catch (error) {
    console.error(`Error calling Cal.com update event type API for ${eventTypeId}:`, error);
    throw error;
  }
}

/**
 * Deletes an Event Type on Cal.com.
 */
export async function deleteCalComEventType(eventTypeId: number): Promise<boolean> {
  if (!env.CALCOM_API_KEY) {
    console.warn("CALCOM_API_KEY not set. Skipping Cal.com event type deletion.");
    return true;
  }

  const baseUrl = env.CALCOM_API_URL || "https://api.cal.com/v2";
  const url = `${baseUrl}/event-types/${eventTypeId}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-06-14",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to delete event type ${eventTypeId} in Cal.com:`, errText);
      throw new Error(`Cal.com error: ${res.statusText} (${errText})`);
    }

    return true;
  } catch (error) {
    console.error(`Error calling Cal.com delete event type API for ${eventTypeId}:`, error);
    throw error;
  }
}

/**
 * Consulta slots disponibles en Cal.com para un eventTypeId y fecha.
 * Retorna lista de {time: "HH:MM", available: boolean}
 */
export async function getCalComAvailableSlots(
  eventTypeId: string,
  dateStr: string,  // "YYYY-MM-DD"
  timeZone = "America/Santiago"
): Promise<{ time: string; available: boolean }[]> {
  if (!env.CALCOM_API_KEY) return [];

  const startTime = `${dateStr}T00:00:00.000Z`;
  const endTime   = `${dateStr}T23:59:59.000Z`;
  const baseUrl   = env.CALCOM_API_URL ?? "https://api.cal.com/v2";
  const url = `${baseUrl}/slots?eventTypeId=${eventTypeId}&start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}&timeZone=${encodeURIComponent(timeZone)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-09-04",
      },
    });
    if (!res.ok) return [];

    // Cal.com v2 responde: { data: { slots: { "YYYY-MM-DD": [{ time: "ISO" }, ...] } } }
    const json = await res.json() as {
      data?: { slots?: Record<string, { time: string }[]> }
    };
    const daySlots = json.data?.slots?.[dateStr] ?? [];
    return daySlots.map(s => ({
      time: s.time.substring(11, 16), // extraer "HH:MM"
      available: true,
    }));
  } catch {
    return [];
  }
}

interface CalComOverrideResponse {
  status: string;
  data: { id: number };
}

/**
 * Crea un Schedule Override en Cal.com (bloquea un rango de tiempo).
 * Retorna el ID del override creado para poder eliminarlo luego.
 */
export async function createCalComScheduleOverride(
  scheduleId: string,
  startAt: Date,
  endAt: Date,
): Promise<number | null> {
  if (!env.CALCOM_API_KEY) return null;

  const baseUrl = env.CALCOM_API_URL ?? "https://api.cal.com/v2";
  const url = `${baseUrl}/schedules/${scheduleId}/overrides`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-09-04",
      },
      body: JSON.stringify({
        start: startAt.toISOString(),
        end:   endAt.toISOString(),
      }),
    });
    if (!res.ok) {
      console.error("Cal.com override error:", await res.text());
      return null;
    }
    const json = await res.json() as CalComOverrideResponse;
    return json.data?.id ?? null;
  } catch (err) {
    console.error("createCalComScheduleOverride error:", err);
    return null;
  }
}

/**
 * Elimina un Schedule Override en Cal.com (desbloquea el rango).
 */
export async function deleteCalComScheduleOverride(
  scheduleId: string,
  overrideId: number,
): Promise<void> {
  if (!env.CALCOM_API_KEY) return;

  const baseUrl = env.CALCOM_API_URL ?? "https://api.cal.com/v2";
  const url = `${baseUrl}/schedules/${scheduleId}/overrides/${overrideId}`;

  try {
    await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-09-04",
      },
    });
  } catch (err) {
    console.error("deleteCalComScheduleOverride error:", err);
  }
}
