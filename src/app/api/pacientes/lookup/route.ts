import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  const queryParam = req.nextUrl.searchParams.get("query") || req.nextUrl.searchParams.get("phone");

  if (!queryParam || queryParam.trim().length < 3) {
    return NextResponse.json(
      { error: "Búsqueda demasiado corta o vacía" },
      { status: 400 }
    );
  }

  const query = queryParam.trim();

  try {
    // Check if the query contains any digits (likely a phone number)
    const isPhone = /[\d]/.test(query);
    let patient = null;

    if (isPhone) {
      // Normalizar: quitar todo menos dígitos y +
      const normalized = query.replace(/[^\d+]/g, "");
      const baseNumber = normalized.replace(/^\+?56/, "");

      patient = await db.patient.findFirst({
        where: {
          OR: [
            { phone: { contains: normalized } },
            { phone: { contains: baseNumber } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });
    } else {
      const words = query.split(/\s+/).filter(Boolean);
      
      if (words.length > 0) {
        const whereClause = {
          AND: words.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: "insensitive" as const } },
              { lastName: { contains: word, mode: "insensitive" as const } },
              { email: { contains: word, mode: "insensitive" as const } },
            ],
          })),
        };

        patient = await db.patient.findFirst({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        });
      }
    }

    if (!patient) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
      },
    });
  } catch (error) {
    console.error("[Patient Lookup Error]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
