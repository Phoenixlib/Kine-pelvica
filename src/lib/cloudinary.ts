/**
 * Cloudinary server-side helper.
 * Solo se usa desde Server Actions o Route Handlers, NUNCA desde el cliente.
 */
import { v2 as cloudinary } from "cloudinary";
import { env } from "~/env";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET ||
    !env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    throw new Error(
      "Cloudinary no está configurado. Verifica las variables de entorno.",
    );
  }
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/**
 * Extrae el public_id de una URL de Cloudinary.
 * Ej: "https://res.cloudinary.com/demo/image/upload/v1234/estudiopelvico/abc.jpg"
 * →   "estudiopelvico/abc"
 */
export function publicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Elimina una o varias imágenes de Cloudinary por URL.
 * Es silencioso: no lanza si la imagen ya no existe o si Cloudinary no está configurado.
 */
export async function destroyByUrls(urls: string[]): Promise<void> {
  try {
    ensureConfigured();
  } catch {
    // Si Cloudinary no está configurado, no hay nada que borrar
    console.warn("[Cloudinary] No configurado — omitiendo borrado de assets.");
    return;
  }

  const publicIds = urls
    .map(publicIdFromUrl)
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, { invalidate: true }),
    ),
  );
}

/**
 * Lista todos los recursos en una carpeta de Cloudinary.
 * Maneja la paginación automáticamente.
 */
export async function listAssetsInFolder(
  folder: string,
): Promise<Array<{ publicId: string; secureUrl: string }>> {
  ensureConfigured();

  const results: Array<{ publicId: string; secureUrl: string }> = [];
  let nextCursor: string | undefined;

  do {
    const response = await cloudinary.api.resources({
      type: "upload",
      prefix: folder,
      max_results: 500,
      next_cursor: nextCursor,
    });

    for (const resource of response.resources as Array<{
      public_id: string;
      secure_url: string;
    }>) {
      results.push({
        publicId: resource.public_id,
        secureUrl: resource.secure_url,
      });
    }

    nextCursor = (response as { next_cursor?: string }).next_cursor;
  } while (nextCursor);

  return results;
}

export { cloudinary };
