"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Debe confirmar su nueva contraseña"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las nuevas contraseñas no coinciden",
  path: ["confirmPassword"],
});

export async function updatePasswordAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { error: "No autorizado. Inicie sesión nuevamente." };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const parsedData = passwordSchema.safeParse({ currentPassword, newPassword, confirmPassword });

    if (!parsedData.success) {
      return { error: parsedData.error.errors[0]?.message || "Datos inválidos" };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: "Usuario no encontrado" };
    }

    const passwordsMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordsMatch) {
      return { error: "La contraseña actual es incorrecta" };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { email: session.user.email },
      data: { password: hashedNewPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    return { error: "Ocurrió un error al actualizar la contraseña" };
  }
}
