import { env } from "../src/env.js";

const CALCOM_API_URL = process.env.CALCOM_API_URL || "https://api.cal.com/v2";
const CALCOM_API_KEY = process.env.CALCOM_API_KEY;

async function run() {
  if (!CALCOM_API_KEY) {
    console.error("CALCOM_API_KEY is not defined.");
    return;
  }
  
  console.log("Fetching existing Event Types...");
  const res = await fetch(`${CALCOM_API_URL}/event-types`, {
    headers: {
      Authorization: `Bearer ${CALCOM_API_KEY}`,
      "cal-api-version": "2024-06-14",
    },
  });

  if (!res.ok) {
    console.error("Failed to fetch event types", await res.text());
    return;
  }

  const data = await res.json();
  const eventTypes = data.data || [];

  console.log(`Found ${eventTypes.length} event types.`);

  for (const et of eventTypes) {
    console.log(`Updating Event Type: ${et.title} (${et.id})`);
    
    const patchRes = await fetch(`${CALCOM_API_URL}/event-types/${et.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-06-14",
      },
      body: JSON.stringify({
        disableGuests: true,
        bookingFields: [
          { type: "name", label: "Nombre completo", required: true },
          { type: "email", label: "Correo electrónico", required: true },
          { type: "phone", slug: "phone", label: "Número de teléfono", required: true },
          { type: "textarea", slug: "notes", label: "Notas adicionales", required: false },
        ],
      }),
    });

    if (!patchRes.ok) {
      console.error(`Failed to update ${et.id}:`, await patchRes.text());
    } else {
      console.log(`Successfully updated ${et.id}.`);
    }
  }
  console.log("Finished updating event types.");
}

run().catch(console.error);
