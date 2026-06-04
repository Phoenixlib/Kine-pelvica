"use client";

import { useState } from "react";
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { updatePasswordAction } from "./actions";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updatePasswordAction(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-subtitle font-bold text-[#0f3f3e]">
          Configuración
        </h1>
        <p className="text-teal/70 mt-1">
          Administra la configuración de tu cuenta y la seguridad.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-cream/40 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <KeyRound size={120} />
        </div>

        <h2 className="text-lg font-bold text-[#0f3f3e] mb-4 flex items-center gap-2">
          <KeyRound size={20} className="text-[#c48a6a]" />
          Cambiar Contraseña
        </h2>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-start gap-3">
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">Contraseña actualizada exitosamente. Tu nueva contraseña ya está activa.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-teal block" htmlFor="currentPassword">
              Contraseña Actual
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-cream bg-[#f7f3ef]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a6a]/30 focus:border-[#c48a6a] transition-all text-teal"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-teal block" htmlFor="newPassword">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-cream bg-[#f7f3ef]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a6a]/30 focus:border-[#c48a6a] transition-all text-teal"
              placeholder="Min. 6 caracteres"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-teal block" htmlFor="confirmPassword">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-cream bg-[#f7f3ef]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a6a]/30 focus:border-[#c48a6a] transition-all text-teal"
              placeholder="Vuelve a escribir la nueva contraseña"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0f3f3e] hover:bg-[#0f3f3e]/90 text-white rounded-xl font-subtitle font-bold text-sm tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Contraseña"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
