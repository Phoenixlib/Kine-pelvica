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
          language: "es",
          ...(attendeePhone ? { phoneNumber: attendeePhone } : {}),
        },
        bookingFieldsResponses: {
          phone: attendeePhone || "+56900000000"
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
        "cal-api-version": "2024-08-13",
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
        locations: [{ type: "address", address: address || "Benigno Posadas 1884, Iquique", public: true }],
        scheduleId: env.CALCOM_SCHEDULE_ID ? Number(env.CALCOM_SCHEDULE_ID) : undefined,
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
        locations: [{ type: "address", address: address || "Benigno Posadas 1884, Iquique", public: true }],
        scheduleId: env.CALCOM_SCHEDULE_ID ? Number(env.CALCOM_SCHEDULE_ID) : undefined,
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

interface CalComOverrideItem {
  date: string;
  startTime: string;
  endTime: string;
}

interface CalComAvailabilityItem {
  days: string[];
  startTime: string;
  endTime: string;
}

interface CalComScheduleData {
  id: number;
  name: string;
  timeZone: string;
  availability: CalComAvailabilityItem[];
  isDefault: boolean;
  overrides: CalComOverrideItem[];
}

interface CalComScheduleResponse {
  status: string;
  data: CalComScheduleData;
}

function formatInSantiago(date: Date) {
  const d = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  return { date: d, time: t };
}

// --- Helpers Matemáticos para Sustracción de Disponibilidad ---
function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minsToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

function getBaseAvailabilityForDate(dateStr: string, availability: CalComAvailabilityItem[]): {start: number, end: number}[] {
  // Parsear fecha en UTC para extraer el día correcto de la semana (evita problemas de timezone)
  const dateObj = new Date(`${dateStr}T12:00:00Z`);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = dayNames[dateObj.getUTCDay()] as string;

  const windows: {start: number, end: number}[] = [];
  for (const rule of availability) {
    if (rule.days.includes(dayOfWeek)) {
      windows.push({ start: timeToMins(rule.startTime), end: timeToMins(rule.endTime) });
    }
  }

  // Unir traslapes
  windows.sort((a, b) => a.start - b.start);
  const merged: {start: number, end: number}[] = [];
  for (const w of windows) {
    if (merged.length === 0) {
      merged.push(w);
    } else {
      const last = merged[merged.length - 1]!;
      if (w.start <= last.end) {
        last.end = Math.max(last.end, w.end);
      } else {
        merged.push(w);
      }
    }
  }
  return merged;
}

function subtractBlock(windows: {start: number, end: number}[], bStart: number, bEnd: number): {start: number, end: number}[] {
  const result: {start: number, end: number}[] = [];
  for (const w of windows) {
    if (bEnd <= w.start || bStart >= w.end) {
      result.push(w);
    } else {
      if (bStart > w.start) result.push({ start: w.start, end: bStart });
      if (bEnd < w.end) result.push({ start: bEnd, end: w.end });
    }
  }
  return result;
}

function addBlock(windows: {start: number, end: number}[], bStart: number, bEnd: number): {start: number, end: number}[] {
  const merged = [...windows, { start: bStart, end: bEnd }];
  merged.sort((a, b) => a.start - b.start);
  
  const result: {start: number, end: number}[] = [];
  for (const w of merged) {
    if (result.length === 0) {
      result.push(w);
    } else {
      const last = result[result.length - 1]!;
      if (w.start <= last.end) {
        last.end = Math.max(last.end, w.end);
      } else {
        result.push(w);
      }
    }
  }
  return result;
}

function isSameWindows(a: {start: number, end: number}[], b: {start: number, end: number}[]): boolean {
  if (a.length !== b.length) return false;
  for (let i=0; i<a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (!itemA || !itemB || itemA.start !== itemB.start || itemA.end !== itemB.end) return false;
  }
  return true;
}

function intersectWindows(a: {start: number, end: number}[], b: {start: number, end: number}[]): {start: number, end: number}[] {
  const result: {start: number, end: number}[] = [];
  for (const wA of a) {
    for (const wB of b) {
      const start = Math.max(wA.start, wB.start);
      const end = Math.min(wA.end, wB.end);
      if (start < end) {
        result.push({ start, end });
      }
    }
  }
  return result;
}

async function updateCalComOverrides(scheduleId: string, overrides: CalComOverrideItem[]) {
  const patchUrl = `${env.CALCOM_API_URL ?? "https://api.cal.com/v2"}/schedules/${scheduleId}`;
  const res = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-06-11",
    },
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cal.com patch error: ${res.statusText} (${errText})`);
  }
}

/**
 * Crea un Schedule Override en Cal.com (sustrayendo el rango de tiempo).
 */
export async function createCalComScheduleOverride(
  scheduleId: string,
  startAt: Date,
  endAt: Date,
): Promise<number | null> {
  if (!env.CALCOM_API_KEY) return null;

  const getUrl = `${env.CALCOM_API_URL ?? "https://api.cal.com/v2"}/schedules/${scheduleId}`;

  try {
    const getRes = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-06-11",
      },
    });

    if (!getRes.ok) throw new Error(await getRes.text());
    const getJson = await getRes.json() as CalComScheduleResponse;
    
    const startSantiago = formatInSantiago(startAt);
    const endSantiago = formatInSantiago(endAt);
    const targetDate = startSantiago.date;

    const currentOverrides = getJson.data?.overrides || [];
    const targetDateOverrides = currentOverrides.filter(o => o.date === targetDate);
    const otherOverrides = currentOverrides.filter(o => o.date !== targetDate);

    const baseAvail = getBaseAvailabilityForDate(targetDate, getJson.data.availability || []);
    let currentWindows: {start: number, end: number}[] = [];

    if (targetDateOverrides.length > 0) {
      const firstOverride = targetDateOverrides[0];
      if (targetDateOverrides.length === 1 && firstOverride && firstOverride.startTime === "00:00" && firstOverride.endTime === "00:00") {
        currentWindows = [];
      } else {
        currentWindows = targetDateOverrides.map(o => ({ start: timeToMins(o.startTime), end: timeToMins(o.endTime) }));
      }
    } else {
      currentWindows = [...baseAvail];
    }

    const newWindows = subtractBlock(currentWindows, timeToMins(startSantiago.time), timeToMins(endSantiago.time));

    let newDateOverrides: CalComOverrideItem[] = [];
    if (newWindows.length === 0) {
      newDateOverrides.push({ date: targetDate, startTime: "00:00", endTime: "00:00" });
    } else {
      newDateOverrides = newWindows.map(w => ({
        date: targetDate,
        startTime: minsToTime(w.start),
        endTime: minsToTime(w.end)
      }));
    }

    await updateCalComOverrides(scheduleId, [...otherOverrides, ...newDateOverrides]);
    return Math.floor(startAt.getTime() / 1000);
  } catch (err) {
    console.error("createCalComScheduleOverride error:", err);
    throw err;
  }
}

/**
 * Elimina un Schedule Override en Cal.com (añadiendo de vuelta la disponibilidad).
 */
export async function deleteCalComScheduleOverride(
  scheduleId: string,
  startAt: Date,
  endAt: Date,
): Promise<void> {
  if (!env.CALCOM_API_KEY) return;

  const getUrl = `${env.CALCOM_API_URL ?? "https://api.cal.com/v2"}/schedules/${scheduleId}`;

  try {
    const getRes = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-06-11",
      },
    });

    if (!getRes.ok) throw new Error(await getRes.text());
    const getJson = await getRes.json() as CalComScheduleResponse;
    
    const startSantiago = formatInSantiago(startAt);
    const endSantiago = formatInSantiago(endAt);
    const targetDate = startSantiago.date;

    const currentOverrides = getJson.data?.overrides || [];
    const targetDateOverrides = currentOverrides.filter(o => o.date === targetDate);
    const otherOverrides = currentOverrides.filter(o => o.date !== targetDate);

    // Si no hay overrides para este día, no hay nada que deshacer
    if (targetDateOverrides.length === 0) return;

    const baseAvail = getBaseAvailabilityForDate(targetDate, getJson.data.availability || []);
    let currentWindows: {start: number, end: number}[] = [];

    const firstOverride = targetDateOverrides[0];
    if (!(targetDateOverrides.length === 1 && firstOverride && firstOverride.startTime === "00:00" && firstOverride.endTime === "00:00")) {
      currentWindows = targetDateOverrides.map(o => ({ start: timeToMins(o.startTime), end: timeToMins(o.endTime) }));
    }

    const newWindowsAdded = addBlock(currentWindows, timeToMins(startSantiago.time), timeToMins(endSantiago.time));
    const newWindows = intersectWindows(newWindowsAdded, baseAvail);

    let newDateOverrides: CalComOverrideItem[] = [];
    if (!isSameWindows(newWindows, baseAvail)) {
      newDateOverrides = newWindows.map(w => ({
        date: targetDate,
        startTime: minsToTime(w.start),
        endTime: minsToTime(w.end)
      }));
    }

    await updateCalComOverrides(scheduleId, [...otherOverrides, ...newDateOverrides]);
  } catch (err) {
    console.error("deleteCalComScheduleOverride error:", err);
    throw err;
  }
}

function parseDateTimeInSantiago(dateStr: string, timeStr: string): Date {
  const testDate = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    timeZoneName: 'longOffset',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(testDate);
  
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value;
  let offset = "-04:00";
  if (offsetPart && offsetPart.startsWith("GMT")) {
    offset = offsetPart.replace("GMT", "");
  }
  if (offset === "") offset = "+00:00";
  
  return new Date(`${dateStr}T${timeStr}:00${offset}`);
}

export async function getCalComVirtualBlockedSlots(startDate: Date, endDate: Date) {
  if (!env.CALCOM_SCHEDULE_ID || !env.CALCOM_API_KEY) return [];

  const getUrl = `${env.CALCOM_API_URL ?? "https://api.cal.com/v2"}/schedules/${env.CALCOM_SCHEDULE_ID}`;
  
  try {
    const getRes = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-06-11",
      },
      next: { revalidate: 0 },
    });

    if (!getRes.ok) return [];
    const getJson = await getRes.json() as CalComScheduleResponse;
    
    const overrides = getJson.data?.overrides || [];
    const availability = getJson.data?.availability || [];

    const overridesByDate = new Map<string, CalComOverrideItem[]>();
    for (const o of overrides) {
      if (!overridesByDate.has(o.date)) overridesByDate.set(o.date, []);
      overridesByDate.get(o.date)!.push(o);
    }

    const virtualBlocks: { id: string; startAt: Date; endAt: Date; reason: string; isVirtual: boolean }[] = [];

    for (const [dateStr, dayOverrides] of Array.from(overridesByDate.entries())) {
      const overrideDate = new Date(`${dateStr}T12:00:00Z`);
      if (overrideDate < new Date(startDate.getTime() - 86400000) || overrideDate > new Date(endDate.getTime() + 86400000)) {
        continue;
      }

      const baseAvail = getBaseAvailabilityForDate(dateStr, availability);
      
      let blockedWindows: {start: number, end: number}[] = [];
      const firstOverride = dayOverrides[0];
      if (dayOverrides.length === 1 && firstOverride && firstOverride.startTime === "00:00" && firstOverride.endTime === "00:00") {
        blockedWindows = [{ start: 0, end: 24 * 60 }];
      } else {
        const overrideWindows = dayOverrides.map(o => ({ start: timeToMins(o.startTime), end: timeToMins(o.endTime) }));
        blockedWindows = [...baseAvail];
        for (const w of overrideWindows) {
          blockedWindows = subtractBlock(blockedWindows, w.start, w.end);
        }
      }

      for (const bw of blockedWindows) {
        if (bw.end <= bw.start) continue;
        
        const startAt = parseDateTimeInSantiago(dateStr, minsToTime(bw.start));
        const endAt = parseDateTimeInSantiago(dateStr, minsToTime(bw.end));
        
        virtualBlocks.push({
          id: `virtual_${startAt.getTime()}_${endAt.getTime()}`,
          startAt,
          endAt,
          reason: "Bloqueo externo (Cal.com)",
          isVirtual: true
        });
      }
    }

    return virtualBlocks;
  } catch (err) {
    console.error("Failed to fetch CalCom virtual blocked slots:", err);
    return [];
  }
}

export async function getCalComScheduleAvailability(): Promise<CalComAvailabilityItem[]> {
  if (!env.CALCOM_SCHEDULE_ID || !env.CALCOM_API_KEY) return [];

  const getUrl = `${env.CALCOM_API_URL ?? "https://api.cal.com/v2"}/schedules/${env.CALCOM_SCHEDULE_ID}`;
  
  try {
    const getRes = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-06-11",
      },
      next: { revalidate: 0 },
    });

    if (!getRes.ok) return [];
    const getJson = await getRes.json() as CalComScheduleResponse;
    return getJson.data?.availability || [];
  } catch (err) {
    console.error("Failed to fetch CalCom schedule availability:", err);
    return [];
  }
}

