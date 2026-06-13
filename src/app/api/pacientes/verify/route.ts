import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, hiddenDigits } = body;

    if (!id || !hiddenDigits || hiddenDigits.length !== 4) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const patient = await db.patient.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      }
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const phoneDigits = patient.phone.replace(/\D/g, "");
    const expectedHidden = phoneDigits.length >= 8 ? phoneDigits.slice(-8, -4) : "";
    
    if (!expectedHidden || expectedHidden !== hiddenDigits) {
      return NextResponse.json({ error: "Los dígitos no coinciden" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
      }
    });

  } catch (error) {
    console.error("[Patient Verify Error]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
