"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { MessageSquare, Check, AlertCircle, Quote } from "lucide-react";

export function BuzonComunidad() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"EXPERIENCE" | "QUESTION">("EXPERIENCE");
  const [consent, setConsent] = useState(false);

  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  const submitMessage = api.communityMessage.submit.useMutation({
    onSuccess: () => {
      setFormStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
      setTimeout(() => setFormStatus("idle"), 5000);
    },
    onError: (err) => {
      setFormStatus("error");
      setFormError(err.message || "Hubo un error al enviar tu mensaje.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message || !consent) return;
    setFormStatus("submitting");
    submitMessage.mutate({
      name,
      email: email || null,
      message,
      type,
    });
  };

  return (
    <section id="buzon" className="py-24 bg-teal text-white">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-cream uppercase mb-4">
            Buzón de la Comunidad
          </h2>
          <h3 className="font-title text-4xl md:text-5xl text-white mb-6">
            Comparte tu <span className="italic font-light text-terracotta">historia</span>
          </h3>
          <p className="font-body text-xl text-white/80 max-w-2xl mx-auto">
            Este es un espacio seguro. Puedes contarnos tu experiencia de recuperación o dejarnos dudas que te gustaría que abordemos en nuestro contenido.
          </p>
        </div>

        {/* Message Form Container */}
        <div className="max-w-2xl mx-auto text-center">
          <form 
            onSubmit={handleSubmit}
            className="bg-offwhite p-6 md:p-10 shadow-xl border-t-[8px] border-terracotta text-left rounded-3xl"
          >
            <div className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal block">
                  ¿Qué quieres enviarnos? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-body text-sm text-teal cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="EXPERIENCE"
                      checked={type === "EXPERIENCE"}
                      onChange={() => setType("EXPERIENCE")}
                      className="text-terracotta focus:ring-terracotta"
                    />
                    Contar una historia/experiencia
                  </label>
                  <label className="flex items-center gap-2 font-body text-sm text-teal cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="QUESTION"
                      checked={type === "QUESTION"}
                      onChange={() => setType("QUESTION")}
                      className="text-terracotta focus:ring-terracotta"
                    />
                    Hacer una consulta
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal block">
                    Nombre o Iniciales *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Camila, o C.O."
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal block">
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com (opcional)"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal block">
                  Tu Mensaje *
                </label>
                <textarea 
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={type === "EXPERIENCE" ? "Cuenta tu historia aquí..." : "Déjanos tu pregunta o duda..."}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition resize-none" 
                />
              </div>

              <div className="flex items-start gap-3 bg-[#0f3f3e]/5 p-4 rounded-xl border border-cream/50">
                <input 
                  type="checkbox" 
                  id="consent" 
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-teal text-teal focus:ring-teal cursor-pointer"
                />
                <label htmlFor="consent" className="font-body text-xs text-teal/80 leading-normal cursor-pointer select-none">
                  Consiento que esta información pueda ser utilizada de forma anónima para generar contenido educativo en el blog o redes sociales de Estudio Pélvico.
                </label>
              </div>

              {formStatus === "success" && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs font-semibold">
                  <Check size={16} className="bg-emerald-100 rounded-full p-0.5" />
                  <span>¡Mensaje enviado con éxito! Muchas gracias por participar.</span>
                </div>
              )}

              {formStatus === "error" && (
                <div className="flex items-center gap-2 text-redbrown bg-redbrown/5 border border-redbrown/20 rounded-xl p-3.5 text-xs font-semibold">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={formStatus === "submitting"}
                className="w-full py-4 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
              >
                {formStatus === "submitting" ? "Enviando..." : "Enviar Mensaje"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}
