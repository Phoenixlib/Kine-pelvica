"use client";

import { useState } from "react";

interface UploadResult {
  secureUrl: string;
  publicId: string;
}

interface UseCloudinaryUploadReturn {
  uploading: boolean;
  uploadFiles: (files: File[]) => Promise<UploadResult[]>;
  error: string | null;
}

/**
 * Comprime una imagen en el cliente usando HTML5 Canvas antes de subirla.
 * Si no es una imagen, si es un GIF animado o si falla el canvas, devuelve el archivo original.
 */
function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensionar solo si excede las dimensiones máximas
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        } else {
          // Si la imagen es más pequeña que el límite, no la procesamos para mantener la fidelidad
          return resolve(file);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: File[]): Promise<UploadResult[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    setError(null);

    try {
      // 1. Obtener firma del servidor
      const sigRes = await fetch("/api/admin/upload-signature");
      if (!sigRes.ok) throw new Error("No se pudo obtener la firma de subida");
      const { signature, timestamp, apiKey, cloudName, folder } =
        await sigRes.json() as {
          signature: string;
          timestamp: number;
          apiKey: string;
          cloudName: string;
          folder: string;
        };

      // 2. Comprimir imágenes localmente antes de subirlas
      const compressedFiles = await Promise.all(
        files.map((file) => compressImage(file)),
      );

      // 3. Subir cada archivo comprimido a Cloudinary directamente desde el browser
      const results: UploadResult[] = await Promise.all(
        compressedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", apiKey);
          formData.append("timestamp", String(timestamp));
          formData.append("signature", signature);
          formData.append("folder", folder);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: formData },
          );

          if (!res.ok) throw new Error(`Error subiendo ${file.name}`);
          const data = await res.json() as {
            secure_url: string;
            public_id: string;
          };

          return {
            secureUrl: data.secure_url,
            publicId: data.public_id,
          };
        }),
      );

      return results;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al subir imágenes";
      setError(msg);
      return [];
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadFiles, error };
}
