import { Phone, Mail } from "lucide-react";

interface AboutProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
}

export function About({ title, description, imageUrl, whatsapp, instagram, facebook, email }: AboutProps) {
  const displayTitle = title || "Acompañando tu bienestar en cada etapa.";

  const defaultDescription = [
    "Soy Camila Ortiz, Kinesióloga especialista en piso pélvico, ubicada en Iquique. Mi propósito es brindar una atención integral, cercana y empática a mujeres, hombres y niños que busquen mejorar su calidad de vida íntima y funcional.",
    "A través de años de especialización en uroginecología, embarazo, postparto y sexualidad terapéutica, he desarrollado un enfoque centrado en la persona, donde cada tratamiento es diseñado específicamente para tus necesidades únicas.",
    "Además, ofrezco tratamiento integral de cicatrices para ayudar a tu cuerpo a sanar adecuadamente, restaurar la movilidad y reducir las molestias asociadas a procesos quirúrgicos o traumáticos."
  ];

  const paragraphs = description
    ? description.split("\n").filter(p => p.trim() !== "")
    : defaultDescription;

  const displayImage = imageUrl || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  return (
    <section id="quien-soy" className="py-24 bg-cream">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Image Side */}
          <div className="w-full lg:w-1/2 relative flex justify-center">
            <div className="w-[85%] aspect-[4/5] rounded-[100px] overflow-hidden border-[12px] border-offwhite shadow-2xl relative z-10 bg-offwhite/30 flex items-center justify-center">
              <img
                src={displayImage}
                alt="Camila Ortiz - Kinesióloga"
                className="w-full h-full object-cover object-top opacity-90"
              />
              <div className="absolute inset-0 bg-offwhite/10 mix-blend-overlay"></div>
            </div>
            {/* Decorative background shape */}
            <div className="absolute -bottom-8 -left-4 w-64 h-64 bg-offwhite mask-radial blur-3xl -z-10 opacity-50"></div>
          </div>

          {/* Text Side */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-4">Quién Soy</h2>
            <h3 className="font-title text-4xl md:text-5xl text-teal mb-6 leading-[1.1] whitespace-pre-line">
              {displayTitle}
            </h3>

            <div className="space-y-6 text-lg text-teal/80 font-body font-light leading-relaxed">
              {paragraphs.map((p, idx) => (
                <p key={idx} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>

            {/* Redes y Contacto */}
            {(whatsapp || instagram || facebook || email) && (
              <div className="mt-8 pt-8 border-t border-teal/10 flex flex-wrap gap-4 items-center">
                <span className="text-[10px] font-subtitle font-bold tracking-wider uppercase text-teal/50 mr-2">Contacto:</span>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-offwhite hover:bg-white text-teal hover:text-[#25D366] text-xs font-semibold shadow-xs border border-cream/30 transition-all"
                  >
                    <Phone size={14} />
                    <span>WhatsApp</span>
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-offwhite hover:bg-white text-teal hover:text-[#E1306C] text-xs font-semibold shadow-xs border border-cream/30 transition-all"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    <span>Instagram</span>
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-offwhite hover:bg-white text-teal hover:text-[#1877F2] text-xs font-semibold shadow-xs border border-cream/30 transition-all"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8H7v3h2v9h4v-9h3.682L17 8h-3V6.72c0-.767.185-1.094.943-1.094H17V2h-2.912C11.166 2 9 3.512 9 6.883V8z"/>
                    </svg>
                    <span>Facebook</span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-offwhite hover:bg-white text-teal hover:text-redbrown text-xs font-semibold shadow-xs border border-cream/30 transition-all"
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
