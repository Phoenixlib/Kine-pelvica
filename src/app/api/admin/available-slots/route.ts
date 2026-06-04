import { NextResponse } from "next/server";
import { getCalComAvailableSlots } from "~/lib/calcom";
import { env } from "~/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  let eventTypeId = searchParams.get("eventTypeId");
  if (!eventTypeId || eventTypeId === "undefined" || eventTypeId === "null") {
    eventTypeId = env.CALCOM_EVENT_TYPE_ID ?? null;
  }

  if (!dateStr || !eventTypeId) {
    return NextResponse.json(
      { error: "date and eventTypeId are required" },
      { status: 400 }
    );
  }

  try {
    const slots = await getCalComAvailableSlots(eventTypeId, dateStr);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
