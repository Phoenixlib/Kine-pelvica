import nodemailer from "nodemailer";
import { env } from "~/env";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587,
  secure: env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: env.SMTP_USER && env.SMTP_PASS ? {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  } : undefined,
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!env.SMTP_HOST) {
    console.warn("SMTP_HOST not configured. Email reset URL logged to console:");
    console.warn(resetUrl);
    return;
  }

  const mailOptions = {
    from: env.SMTP_FROM || `"Estudio Pélvico" <noreply@estudiopelvico.cl>`,
    to,
    subject: "Restablecer tu contraseña - Estudio Pélvico Camila Ortiz",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #0f3f3e; text-align: center;">Restablecer Contraseña</h2>
        <p>Hola,</p>
        <p>Has recibido este correo porque se solicitó un restablecimiento de contraseña para tu cuenta en el panel administrativo de Estudio Pélvico Camila Ortiz.</p>
        <p>Puedes restablecer tu contraseña haciendo clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #c48a6a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
        </div>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este restablecimiento, puedes ignorar este correo de forma segura.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Estudio Pélvico Camila Ortiz</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
