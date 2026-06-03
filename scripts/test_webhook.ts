import crypto from "crypto";
import { env } from "../src/env.js";

const BASE_URL = "http://localhost:3000";
const SECRET = process.env.CALCOM_WEBHOOK_SECRET || "5lviqcAbtf93Y0nbKPNF7R0RrRab2n/RTCNfgCoOSGw=";

async function sendWebhook(payload: any) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", SECRET.trim()).update(body).digest("hex");
  
  const res = await fetch(`${BASE_URL}/api/webhooks/calcom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cal-signature-256": signature,
    },
    body,
  });

  return { status: res.status, text: await res.text() };
}

async function testLookup(phone: string) {
  const res = await fetch(`${BASE_URL}/api/pacientes/lookup?phone=${encodeURIComponent(phone)}`);
  return { status: res.status, json: await res.json() };
}

async function runTests() {
  const testEmail = "test_" + Date.now() + "@example.com";
  const testPhone = "+56999999" + Math.floor(100 + Math.random() * 900);
  const calcomUid = "test_uid_" + Date.now();

  console.log("--- TEST 1: BOOKING_CREATED ---");
  const payloadCreated = {
    triggerEvent: "BOOKING_CREATED",
    payload: {
      id: Math.floor(Math.random() * 1000000),
      uid: calcomUid,
      title: "Cita Kinesiológica Test",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: "ACCEPTED",
      attendees: [
        {
          name: "Test User",
          email: testEmail,
        }
      ],
      responses: {
        phone: { value: testPhone },
        notes: { value: "Notas de prueba" },
      },
    },
  };
  
  const resCreated = await sendWebhook(payloadCreated);
  console.log("Response:", resCreated);

  console.log("\n--- TEST 2: PACIENTE LOOKUP ---");
  const resLookup = await testLookup(testPhone);
  console.log("Lookup result:", resLookup);
  if (resLookup.json?.patient?.email === testEmail) {
    console.log("✅ Paciente Lookup exitoso!");
  } else {
    console.error("❌ Paciente Lookup falló.");
  }

  console.log("\n--- TEST 3: BOOKING_CANCELLED ---");
  const payloadCancelled = {
    triggerEvent: "BOOKING_CANCELLED",
    payload: {
      uid: calcomUid,
    },
  };
  const resCancelled = await sendWebhook(payloadCancelled);
  console.log("Response:", resCancelled);
  
  console.log("\n--- FINISH ---");
}

runTests().catch(console.error);
