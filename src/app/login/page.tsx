"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogoSVG } from "~/components/Logo";
import { Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Credenciales incorrectas. Inténtalo de nuevo.");
        setLoading(false);
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrió un error inesperado. Por favor, intenta más tarde.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-cream) 0.5px, transparent 0.5px)', backgroundSize: '35px 35px' }}></div>
      <div className="absolute top-0 right-0 w-[50%] h-full bg-cream/5 -z-10"></div>
      
      {/* Back Link */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 inline-flex items-center text-cream hover:text-white font-subtitle text-xs uppercase tracking-widest font-bold transition-colors gap-2"
      >
        <ArrowLeft size={16} /> Volver al Inicio
      </Link>

      <div className="w-full max-w-md bg-offwhite rounded-3xl shadow-2xl overflow-hidden border-t-[8px] border-terracotta p-8 md:p-10 relative z-10">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <LogoSVG size="small" className="text-teal mb-4 scale-90" />
          <h2 className="font-title text-2xl text-teal mt-2">
            Panel de Control
          </h2>
          <p className="font-body text-sm text-teal/60 mt-1">
            Ingresa tus credenciales para acceder a la administración
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-redbrown/10 border border-redbrown/30 rounded-xl p-4 mb-6 flex items-start gap-3 text-redbrown">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p className="font-body text-xs leading-normal font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@estudiopelvico.cl"
                className="w-full pl-10 pr-4 py-3.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors placeholder:text-teal/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal block">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-teal/40">
                <Lock size={16} />
              </span>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors placeholder:text-teal/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-teal text-white rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase hover:bg-teal/90 transition-all shadow-md mt-8 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
