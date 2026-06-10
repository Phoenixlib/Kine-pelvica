"use client";

import { useState } from "react";
import Link from "next/link";
import CalComEmbed, { type CalComPrefill } from "./CalComEmbed";
import { api } from "~/trpc/react";

type Step = "lookup" | "embed";

interface BookingFlowProps {
  calLink: string; // e.g. "camila-ortiz/evaluacion-pelvica"
  onClose?: () => void;
}

export default function BookingFlow({ calLink, onClose }: BookingFlowProps) {
  const [step, setStep] = useState<Step>("lookup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prefill, setPrefill] = useState<CalComPrefill>({});
  const [query, setQuery] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [highlightPolicies, setHighlightPolicies] = useState(false);

  const { data: configData } = api.siteConfig.get.useQuery({
    keys: [
      "bank_name",
      "bank_rut",
      "bank_bank",
      "bank_account_type",
      "bank_account_number",
      "bank_email",
    ],
  });

  const bankName = configData?.bank_name || "Camila Ortiz";
  const bankRut = configData?.bank_rut || "17.798.781-6";
  const bankBank = configData?.bank_bank || "Banco de Chile";
  const bankAccountType = configData?.bank_account_type || "Cuenta Corriente";
  const bankAccountNumber = configData?.bank_account_number || "00-1 07-24890-05";
  const bankEmail = configData?.bank_email || "Camilaortiz.kine@gmail.com";

  const formatPhoneForCalcom = (phoneStr: string) => {
    // Normalizar: quitar espacios, guiones y paréntesis
    let cleaned = phoneStr.replace(/[\s-()]/g, "").trim();
    if (cleaned.startsWith("+56")) {
      return cleaned;
    } else if (cleaned.startsWith("56") && cleaned.length > 9) {
      return "+" + cleaned;
    }
    return "+56" + cleaned;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedPolicies) {
      setHighlightPolicies(true);
      setTimeout(() => setHighlightPolicies(false), 500);
      return;
    }
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
      const data = (await res.json()) as {
        found: boolean;
        patient?: {
          firstName: string;
          lastName: string;
          email: string | null;
          phone: string;
        };
      };

      if (data.found && data.patient) {
        // Paciente conocido → pre-llenar con sus datos guardados
        setPrefill({
          name: `${data.patient.firstName} ${data.patient.lastName}`.trim(),
          email: data.patient.email ?? "",
          attendeePhoneNumber: formatPhoneForCalcom(data.patient.phone),
        });
        setStep("embed");
      } else {
        // No se encontró el paciente
        setError(
          "No encontramos a un cliente con estos datos. Verifica si hay algún error en tu nombre o teléfono, o si es tu primera vez en Estudio Pelvico por favor vuelve e ingresa por la opción de nuevo cliente.",
        );
      }
    } catch {
      setError(
        "Ocurrió un error al buscar tus datos. Por favor intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDirectBooking = () => {
    if (!acceptedPolicies) {
      setHighlightPolicies(true);
      setTimeout(() => setHighlightPolicies(false), 500);
      return;
    }
    // Primera vez → abrir embed con prefijo +56 por defecto
    setPrefill({ attendeePhoneNumber: "+56" });
    setStep("embed");
  };

  const handleBookingSuccess = (e: any) => {
    // e.detail.data contains the booking info in cal.com v2
    setBookingSuccessData(e?.detail?.data || e?.data || {});
  };

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (bookingSuccessData) {
    // Calcular fecha del booking
    const bookingDate = bookingSuccessData?.date
      ? new Date(bookingSuccessData.date)
      : bookingSuccessData?.startTime
        ? new Date(bookingSuccessData.startTime)
        : null;

    const formattedDateString = bookingDate
      ? bookingDate.toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }) +
      " - " +
      bookingDate
        .toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace("a. m.", "am")
        .replace("p. m.", "pm")
      : "";

    // Obtener nombres de los asistentes
    const attendeeName =
      bookingSuccessData?.attendees?.[0]?.name || prefill?.name || "";

    return (
      <div className="w-full bg-white p-6 md:p-8 rounded-3xl animate-in fade-in zoom-in duration-300 flex flex-col items-center">
        {/* Ícono de Visto Verde */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-redbrown/80 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-redbrown"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Mensaje de Gratitud Personalizado */}
        <h2 className="text-lg md:text-xl font-subtitle font-bold text-teal text-center mb-6 leading-relaxed max-w-lg">
          ¡Gracias {attendeeName} por agendar en Estudio Pélvico Camila Ortiz!
        </h2>

        {/* Caja de Información Importante */}
        <div className="w-full bg-[#f7f3ef] border border-cream/50 rounded-2xl p-5 mb-6 text-sm text-teal leading-relaxed space-y-4 shadow-xs">
          <h3 className="font-subtitle font-bold text-sm md:text-base uppercase tracking-wider text-terracotta flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Información importante para su cita
          </h3>
          <p className="font-body text-sm md:text-[15px] leading-relaxed text-teal/90">
            El día previo a su atención se enviará un recordatorio vía
            WhatsApp (asegúrese de haber escrito correctamente su número de
            contacto), donde podrá confirmar su asistencia adjuntando el
            comprobante de pago.
          </p>
          <p className="font-body text-sm md:text-[15px] leading-relaxed text-teal/90">
            Para mantener su hora, es necesario enviar el comprobante de
            pago antes de las 18:00 hrs del día hábil anterior. De lo
            contrario, el cupo será liberado automáticamente.
          </p>
          <p className="font-body text-sm md:text-[15px] leading-relaxed text-teal/90">
            Las citas pueden modificarse o cancelarse hasta las 18:00 hrs
            del día hábil anterior. Posterior a ese horario, la sesión se
            considera realizada, sin derecho a reembolso. En caso de
            urgencia médica real, se podrá evaluar la reprogramación
            presentando el respaldo correspondiente. Agradecemos su
            comprensión y el respeto por el tiempo de todos.
          </p>

          <div className="border-t border-cream/40 pt-4">
            <h4 className="font-subtitle font-bold text-xs uppercase tracking-wider text-[#0f3f3e] mb-3">
              Datos de Transferencia Bancaria:
            </h4>
            <div className="bg-white rounded-xl p-4 border border-cream/30 space-y-2.5 font-body text-xs text-teal relative">
              <div className="flex justify-between items-center py-1 border-b border-offwhite">
                <span>
                  Nombre:{" "}
                  <strong className="font-subtitle font-bold text-teal">
                    {bankName}
                  </strong>
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-offwhite">
                <span>
                  Rut:{" "}
                  <strong className="font-subtitle font-bold text-teal">
                    {bankRut}
                  </strong>
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-offwhite">
                <span>
                  Banco:{" "}
                  <strong className="font-subtitle font-bold text-teal">
                    {bankBank}
                  </strong>
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-offwhite">
                <span>
                  Tipo Cuenta:{" "}
                  <strong className="font-subtitle font-bold text-teal">
                    {bankAccountType}
                  </strong>
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-offwhite">
                <span>
                  Nº Cuenta:{" "}
                  <strong className="font-subtitle font-bold text-teal">
                    {bankAccountNumber}
                  </strong>
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>
                  Email:{" "}
                  <strong className="font-subtitle font-bold text-teal">
                    {bankEmail}
                  </strong>
                </span>
              </div>

              {/* Botón único para copiar todos los datos de transferencia */}
              <button
                type="button"
                onClick={() => {
                  const allDetails = `Nombre: ${bankName}\nRut: ${bankRut}\nBanco: ${bankBank}\nTipo Cuenta: ${bankAccountType}\nNº Cuenta: ${bankAccountNumber}\nEmail: ${bankEmail}`;
                  copyToClipboard(allDetails, "transferencia");
                }}
                className="w-full flex items-center justify-center gap-2 mt-3 bg-[#e6ded9] hover:bg-[#ded5ce] text-[#0f3f3e] font-subtitle uppercase tracking-widest font-bold text-[10px] py-2.5 px-4 rounded-xl transition duration-200"
              >
                {copiedField === "transferencia" ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-700 animate-bounce"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    ¡Datos Copiados!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar Datos de Transferencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Detalle de Cita de la Imagen */}
        <h2 className="text-lg md:text-xl font-subtitle font-bold text-teal text-center mb-6 mt-2 leading-relaxed max-w-lg">
          Detalle de tu cita
        </h2>
        <div className="w-full max-w-md bg-white border border-cream rounded-2xl p-5 md:p-6 mb-8 text-teal font-body shadow-sm">
          <div className="divide-y divide-offwhite space-y-4">
            {/* Servicio */}
            <div className="flex items-start gap-4 pb-4">
              <div className="pt-0.5 text-teal/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-teal/50 font-subtitle text-[11px] uppercase tracking-wider block">
                  Servicio
                </span>
                <span className="font-subtitle font-medium text-sm text-teal block truncate">
                  {bookingSuccessData?.title ||
                    bookingSuccessData?.eventType?.title ||
                    "Evaluación pélvica"}
                </span>
              </div>
            </div>

            {/* Fecha y Hora  */}
            <div className="flex items-start gap-4 py-4">
              <div className="pt-0.5 text-teal/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-teal/50 font-subtitle text-[11px] uppercase tracking-wider block">
                  Fecha y hora
                </span>
                <span className="font-subtitle font-medium text-sm text-teal block capitalize">
                  {formattedDateString || "Pendiente"}
                </span>
              </div>
            </div>

            {/* Ubicación */}
            <div className="flex items-start gap-4 py-4">
              <div className="pt-0.5 text-teal/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-teal/50 font-subtitle text-[11px] uppercase tracking-wider block">
                  Ubicación
                </span>
                <span className="font-subtitle font-medium text-sm text-teal block leading-relaxed text-balance">
                  {bookingSuccessData?.location ||
                    "Estudio Pélvico Camila Ortiz, Benigno Posadas 1884, Iquique, Chile"}
                </span>
              </div>
            </div>

            {/* Precio */}
            <div className="flex items-start gap-4 pt-4">
              <div className="pt-0.5 text-teal/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-teal/50 font-subtitle text-[11px] uppercase tracking-wider block">
                  Precio
                </span>
                <span className="font-subtitle font-bold text-sm text-redbrown block">
                  $35.000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Acción de Cerrar */}
        <button
          onClick={() => {
            setBookingSuccessData(null);
            setStep("lookup");
            setQuery("");
            setAcceptedPolicies(false);
            onClose?.();
          }}
          className="bg-[#0f3f3e] text-white px-8 py-3 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-terracotta transition-colors shadow-sm"
        >
          Cerrar y Volver
        </button>
      </div>
    );
  }

  if (step === "embed") {
    return (
      <div className="w-full relative">
        <CalComEmbed
          calLink={calLink}
          prefill={prefill}
          onSuccess={handleBookingSuccess}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl border border-cream/50">
      <h2 className="text-xl font-bold mb-2 text-teal font-title text-center">
        ¿Ya eres paciente de Estudio Pélvico?
      </h2>
      <p className="text-sm text-teal/70 text-center mb-6">
        Ingresa tu nombre o teléfono para buscar tu ficha y agilizar tu reserva
        con tus datos.
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
          disabled={loading}
          className="w-full bg-terracotta text-white p-3 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-teal transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {loading ? "Buscando..." : "Buscar Cuenta"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-cream"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-teal/40 font-subtitle tracking-wider">
            o también
          </span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <p className="text-xs text-teal/60 font-body">
          ¿Es tu primera vez en Estudio Pélvico?
        </p>
        <button
          type="button"
          onClick={handleDirectBooking}
          className="w-full border border-terracotta/40 text-terracotta bg-white p-3 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-terracotta/5 hover:border-terracotta transition-colors shadow-sm cursor-pointer"
        >
          Primera vez, quiero reservar directamente 🌸
        </button>
      </div>

      <div className={`mt-6 flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 ${
        highlightPolicies
          ? "animate-shake border-terracotta bg-terracotta/10 shadow-md ring-2 ring-terracotta/20"
          : "bg-slate-50 border-slate-100"
      }`}>
        <input
          type="checkbox"
          id="policies"
          checked={acceptedPolicies}
          onChange={(e) => setAcceptedPolicies(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-terracotta focus:ring-terracotta cursor-pointer"
        />
        <label
          htmlFor="policies"
          className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none"
        >
          He leído y acepto las{" "}
          <Link
            href="/politicas-de-atencion"
            target="_blank"
            className="text-terracotta underline hover:text-terracotta/80"
          >
            Políticas de Atención
          </Link>{" "}
          y cancelación de la clínica.
        </label>
      </div>
    </div>
  );
}
