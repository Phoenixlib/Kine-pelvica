import { env } from "./src/env.js";

async function check() {
  const dateStr = "2026-06-05";
  const eventTypeId = env.CALCOM_EVENT_TYPE_ID;
  
  const startTime = `${dateStr}T00:00:00.000Z`;
  const endTime   = `${dateStr}T23:59:59.000Z`;
  const baseUrl   = env.CALCOM_API_URL ?? "https://api.cal.com/v2";
  const timeZone  = "America/Santiago";
  const url = `${baseUrl}/slots?eventTypeId=${eventTypeId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&timeZone=${encodeURIComponent(timeZone)}`;

  console.log("URL:", url);

  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-09-04",
      },
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (error) {
    console.error("Error:", error);
  }
}

check();
