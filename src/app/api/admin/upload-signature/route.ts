import { auth } from "~/server/auth";
import { NextResponse } from "next/server";
import { env } from "~/env";
import crypto from "node:crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (
    !env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      { error: "Cloudinary no configurado" },
      { status: 503 },
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "estudiopelvico/galeria";

  // La firma se calcula sobre los parámetros ordenados alfabéticamente
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha256")
    .update(paramsToSign + env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder,
  });
}
