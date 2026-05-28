"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { MessageSquare, Check, AlertCircle, Quote } from "lucide-react";

import { type TestimonialStatus } from "../../generated/prisma";

interface Testimonial {
  id: string;
  name: string;
  email: string | null;
  message: string;
  createdAt: Date;
  status: TestimonialStatus;
}

interface TestimonialsProps {
  initialTestimonials?: Testimonial[] | null;
}

export function Testimonials({ initialTestimonials }: TestimonialsProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  const utils = api.useUtils();
  const { data: dbTestimonials } = api.testimonial.getAllVisible.useQuery(undefined, {
    initialData: initialTestimonials || undefined,
  });

  const submitTestimonial = api.testimonial.submit.useMutation({
    onSuccess: () => {
      setFormStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
      void utils.testimonial.getAllVisible.invalidate();
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
    submitTestimonial.mutate({
      name,
      email: email || null,
      message,
    });
  };

  const displayList = dbTestimonials || [];

  return (
    <section id="testimonios" className="py-24 bg-teal text-white">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-cream uppercase mb-4">Testimonios</h2>
          <h3 className="font-title text-4xl md:text-5xl text-white mb-6">Lo que dicen <span className="italic font-light text-terracotta">nuestros pacientes</span></h3>
          <p className="font-body text-xl text-white/80 max-w-2xl mx-auto">
            La confianza y la recuperación de quienes nos visitan es nuestro mayor orgullo.
          </p>
        </div>

        {/* Testimonials List Grid / Slider */}
        {displayList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {displayList.map((t) => (
              <div 
                key={t.id} 
                className="bg-[#134948] border border-white/10 rounded-3xl p-6 relative flex flex-col justify-between hover:border-terracotta/40 hover:shadow-lg transition duration-300"
              >
                <Quote className="absolute top-4 right-4 text-terracotta/20" size={32} />
                <p className="font-body text-sm text-white/90 leading-relaxed italic mb-6">
                  "{t.message}"
                </p>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="font-subtitle text-xs font-bold uppercase tracking-wider text-cream">
                    {t.name}
                  </h4>
                  <span className="text-[10px] text-white/50 font-semibold uppercase mt-0.5 block">Paciente Verificado</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Testimonial Form Container */}
        <div className="max-w-2xl mx-auto text-center" id="contacto">
          <h4 className="font-title text-2xl md:text-3xl text-white mb-2">¡Déjanos tu testimonio o consulta!</h4>
          <p className="font-body text-sm text-white/70 mb-8">
            Nos encantaría saber de tu experiencia. Tu mensaje será moderado antes de aparecer en la web.
          </p>

          <form 
            onSubmit={handleSubmit}
            className="bg-offwhite p-6 md:p-10 shadow-xl border-t-[8px] border-terracotta text-left rounded-3xl"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal block">
                    Nombre *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
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
                  Mensaje o Testimonio *
                </label>
                <textarea 
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Comparte tu experiencia o haznos una consulta..."
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
                  Consiento voluntariamente que, en caso de ser un testimonio positivo, este pueda ser publicado en la sección de testimonios de la página web de forma anónima o con mis iniciales.
                </label>
              </div>

              {formStatus === "success" && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs font-semibold">
                  <Check size={16} className="bg-emerald-100 rounded-full p-0.5" />
                  <span>¡Mensaje enviado con éxito! Camila lo revisará antes de publicarlo.</span>
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
