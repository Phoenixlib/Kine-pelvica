"use client";

import { useState } from "react";
import { requestPasswordResetAction } from "./actions";
import { LogoSVG } from "~/components/Logo";
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordResetAction(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-teal flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-cream) 0.5px, transparent 0.5px)', backgroundSize: '35px 35px' }}></div>
      <div className="absolute top-0 right-0 w-[50%] h-full bg-cream/5 -z-10"></div>
      
      {/* Back Link */}
      <Link 
        href="/login" 
        className="absolute top-8 left-8 inline-flex items-center text-cream hover:text-white font-subtitle text-xs uppercase tracking-widest font-bold transition-colors gap-2"
      >
        <ArrowLeft size={16} /> Volver al Login
      </Link>

      <div className="w-full max-w-md bg-offwhite rounded-3xl shadow-2xl overflow-hidden border-t-[8px] border-terracotta p-8 md:p-10 relative z-10">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <LogoSVG size="small" className="text-teal mb-4 scale-90" />
          <h2 className="font-title text-2xl text-teal mt-2">
            Recuperar Contraseña
          </h2>
          <p className="font-body text-sm text-teal/60 mt-1">
            Ingresa tu correo para recibir las instrucciones
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-redbrown/10 border border-redbrown/30 rounded-xl p-4 mb-6 flex items-start gap-3 text-redbrown">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p className="font-body text-xs leading-normal font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-6 flex flex-col items-center gap-4">
              <CheckCircle2 size={48} className="text-green-500" />
              <p className="font-body text-sm font-medium">
                Si el correo <span className="font-bold">{email}</span> está registrado, recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>
            
            <div className="mt-4 p-4 border border-teal/20 bg-teal/5 rounded-xl text-teal text-xs">
              <p><strong>Nota (Modo Desarrollo):</strong> Revisa la consola del servidor (terminal donde se ejecuta npm run dev) para ver el enlace de recuperación, ya que el envío de correos no está configurado.</p>
            </div>
            
            <Link 
              href="/login"
              className="inline-block w-full py-4 bg-teal text-white rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase hover:bg-teal/90 transition-all shadow-md"
            >
              Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal block">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-teal/40">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@estudiopelvico.cl"
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors placeholder:text-teal/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-teal text-white rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase hover:bg-teal/90 transition-all shadow-md mt-8 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar Enlace"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
