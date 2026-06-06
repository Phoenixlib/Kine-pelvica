"use client";

import { useState } from "react";
import Link from "next/link";
import CalComEmbed, { type CalComPrefill } from "./CalComEmbed";

type Step = "lookup" | "embed";

interface BookingFlowProps {
  calLink: string; // e.g. "camila-ortiz/evaluacion-pelvica"
}

export default function BookingFlow({ calLink }: BookingFlowProps) {
  const [step, setStep] = useState<Step>("lookup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prefill, setPrefill] = useState<CalComPrefill>({});
  const [query, setQuery] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  const cleanPhoneForCalcom = (phoneStr: string) => {
    // Normalizar: quitar espacios, guiones y paréntesis
    let cleaned = phoneStr.replace(/[\s-()]/g, "").trim();
    if (cleaned.startsWith("+56")) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith("56") && cleaned.length > 9) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Por favor ingresa tu nombre o teléfono.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const url = new URL("/api/pacientes/lookup", window.location.origin);
      url.searchParams.append("query", query.trim());
      const res = await fetch(url.toString());
      const data = await res.json() as { 
        found: boolean; 
        patient?: { firstName: string; lastName: string; email: string | null; phone: string } 
      };

      if (data.found && data.patient) {
        // Paciente conocido → pre-llenar con sus datos guardados
        setPrefill({
          name: `${data.patient.firstName} ${data.patient.lastName}`.trim(),
          email: data.patient.email ?? "",
          attendeePhoneNumber: cleanPhoneForCalcom(data.patient.phone),
        });
        setStep("embed");
      } else {
        // No se encontró el paciente
        setError(
          "No encontramos a un cliente con estos datos. Verifica si hay algún error en tu nombre o teléfono, o si es tu primera vez en Estudio Pelvico por favor vuelve e ingresa por la opción de nuevo cliente."
        );
      }
    } catch {
      setError("Ocurrió un error al buscar tus datos. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectBooking = () => {
    // Primera vez → abrir embed vacío
    setPrefill({});
    setStep("embed");
  };

  const handleBookingSuccess = (e: any) => {
    // e.detail.data contains the booking info in cal.com v2
    setBookingSuccessData(e?.detail?.data || e?.data || {});
  };

  if (step === "embed") {
    return (
      <div className="w-full relative">
        <CalComEmbed calLink={calLink} prefill={prefill} onSuccess={handleBookingSuccess} />
        
        {/* Modal de éxito sobre el embed */}
        {bookingSuccessData && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 rounded-3xl animate-in fade-in zoom-in duration-300">
            <div className="bg-teal/5 p-4 rounded-full mb-6">
              <svg className="w-12 h-12 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-teal font-title mb-4 text-center">¡Reserva Confirmada!</h2>
            <p className="text-slate-600 mb-8 text-center max-w-md leading-relaxed">
              Tu hora ha sido agendada con éxito. Recibirás un correo con los detalles y el enlace (si aplica) en breve.
            </p>
            <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
              <div className="space-y-4">
                {bookingSuccessData.date && (
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-slate-500 text-sm">Fecha y Hora</span>
                    <span className="font-semibold text-slate-800 text-sm text-right">
                      {new Date(bookingSuccessData.date).toLocaleString('es-CL', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </span>
                  </div>
                )}
                {bookingSuccessData.title && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Servicio</span>
                    <span className="font-semibold text-slate-800 text-sm text-right">{bookingSuccessData.title}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setBookingSuccessData(null);
                setStep("lookup");
                setQuery("");
                setAcceptedPolicies(false);
              }}
              className="bg-terracotta text-white px-8 py-3 rounded-full font-subtitle text-sm uppercase tracking-widest font-bold hover:bg-teal transition-colors shadow-sm"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl border border-cream/50">
      <h2 className="text-xl font-bold mb-2 text-teal font-title text-center">
        ¿Ya eres paciente de Estudio Pélvico?
      </h2>
      <p className="text-sm text-teal/70 text-center mb-6">
        Ingresa tu nombre o teléfono para buscar tu ficha y agilizar tu reserva con tus datos.
      </p>

      <form onSubmit={handleLookup} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="ej. Juan Pérez o +569..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 rounded-xl border border-cream focus:outline-none focus:ring-2 focus:ring-terracotta/40 text-sm text-teal placeholder-teal/40"
            disabled={loading}
            required
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600 leading-relaxed text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !acceptedPolicies}
          className="w-full bg-terracotta text-white p-3 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-teal transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? "Buscando..." : "Buscar Cuenta"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-cream"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-teal/40 font-subtitle tracking-wider">o también</span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <p className="text-xs text-teal/60 font-body">
          ¿Es tu primera vez en Estudio Pélvico?
        </p>
        <button
          type="button"
          onClick={handleDirectBooking}
          disabled={!acceptedPolicies}
          className="w-full border border-terracotta/40 text-terracotta bg-white p-3 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-terracotta/5 hover:border-terracotta transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-terracotta/40"
        >
          Primera vez, quiero reservar directamente 🌸
        </button>
      </div>

      <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <input
          type="checkbox"
          id="policies"
          checked={acceptedPolicies}
          onChange={(e) => setAcceptedPolicies(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-terracotta focus:ring-terracotta"
        />
        <label htmlFor="policies" className="text-xs text-slate-600 leading-relaxed">
          He leído y acepto las{" "}
          <Link href="/politicas-de-atencion" target="_blank" className="text-terracotta underline hover:text-terracotta/80">
            Políticas de Atención
          </Link>
          {" "}y cancelación de la clínica.
        </label>
      </div>
    </div>
  );
}
