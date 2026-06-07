"use server";

import { db } from "~/server/db";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "~/server/email";

export async function requestPasswordResetAction(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    if (!email) {
      return { error: "El correo electrónico es requerido." };
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { success: true };
    }

    // Generate token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token in DB
    await db.passwordResetToken.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/recuperar-password/reset?token=${token}`;
    
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error("Error al enviar el email de restablecimiento:", emailError);
      return { error: "No se pudo enviar el correo de recuperación. Verifica la configuración SMTP." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error al solicitar el restablecimiento de contraseña:", error);
    return { error: "Ocurrió un error al procesar la solicitud." };
  }
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !password || !confirmPassword) {
      return { error: "Todos los campos son requeridos." };
    }

    if (password !== confirmPassword) {
      return { error: "Las contraseñas no coinciden." };
    }

    if (password.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres." };
    }

    // Find the token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { error: "El enlace de restablecimiento es inválido o ha expirado." };
    }

    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return { error: "El enlace de restablecimiento ha expirado." };
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete token so it can't be reused
    await db.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    return { error: "Ocurrió un error al restablecer la contraseña." };
  }
}
