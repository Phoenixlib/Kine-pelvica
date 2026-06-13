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
    let patients: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string;
    }[] = [];

    if (isPhone) {
      // Normalizar: quitar todo menos dígitos y +
      const normalized = query.replace(/[^\d+]/g, "");
      const baseNumber = normalized.replace(/^\+?56/, "");

      patients = await db.patient.findMany({
        where: {
          OR: [
            { phone: { contains: normalized } },
            { phone: { contains: baseNumber } },
          ],
        },
        take: 5,
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

        patients = await db.patient.findMany({
          where: whereClause,
          take: 5,
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

    if (!patients || patients.length === 0) {
      return NextResponse.json({ found: false });
    }

    // Enmascarar datos para privacidad
    const maskedPatients = patients.map((p) => {
      let maskedEmail = null;
      if (p.email) {
        const [name, domain] = p.email.split("@");
        if (name && domain) {
          if (name.length > 2) {
            maskedEmail = `${name[0]}****${name[name.length - 1]}@${domain}`;
          } else {
            maskedEmail = `****@${domain}`;
          }
        }
      }

      // Format phone as +56 9 **** 1234
      const digits = p.phone.replace(/\D/g, "");
      const last4 = digits.length >= 4 ? digits.slice(-4) : digits;
      const maskedPhone = `+56 9 **** ${last4}`;

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        maskedEmail,
        maskedPhone,
      };
    });

    return NextResponse.json({
      found: true,
      patients: maskedPatients,
    });
  } catch (error) {
    console.error("[Patient Lookup Error]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
