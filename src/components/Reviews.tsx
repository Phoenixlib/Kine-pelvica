import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { env } from "~/env";

export function Reviews() {
  const reviews = [
    {
      name: "Romina Ortiz C.",
      time: "hace 3 meses",
      avatar: "R",
      color: "bg-blue-500",
      text: "La atención de Camila es espectacular. Muy profesional, me explicó todo con detalle y me transmitió muchísima confianza desde la primera sesión. ¡De lujo!",
    },
    {
      name: "Veronica Suarez",
      time: "hace 3 meses",
      avatar: "V",
      color: "bg-teal",
      text: "Muy contenta con el servicio y la información que entrega ante cualquier duda. Una profesional de primera calidad, me ayudó muchísimo con mi dolor pélvico.",
    },
    {
      name: "Consta Silva Gomez",
      time: "hace 4 meses",
      avatar: "C",
      color: "bg-terracotta",
      text: "Estoy muy agradecida por la atención y ayuda 🙌 Llevo menos de 2 semanas y ya hay cambios notorios. Full recomendado, Gracias!",
    },
  ];

  return (
    <section className="py-24 bg-cream">
      <div className="container mx-auto px-4 lg:px-8">
        
        <div className="text-center mb-16">
          <p className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-2">Testimonios</p>
          <h3 className="font-title text-4xl md:text-5xl text-teal">Qué dicen <span className="italic font-light text-terracotta">nuestros pacientes</span></h3>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          
          {/* Summary Box */}
          <div className="flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow-xl border-4 border-white min-w-[260px] relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                <span className="text-[#4285f4] font-bold leading-none text-xl">G</span>
             </div>
             
             <span className="font-subtitle font-bold text-sm text-teal mt-4 mb-2">Google My Business</span>
             <div className="flex text-[#fbbc04] mb-2 gap-1">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} fill="currentColor" stroke="none" size={24} />
                ))}
             </div>
             <p className="text-[10px] text-teal/50 font-bold uppercase tracking-widest text-center mt-2 border-t border-cream/50 pt-4 w-full">
               4.9 | 175 Reseñas Reales
             </p>
             <a href={env.GOOGLE_REVIEW_URL || "https://search.google.com/local/writereview?placeid=ChIJRbsg_E4VUpERWEsDb_n9txA"} target="_blank" rel="noopener noreferrer" className="mt-4 border border-teal text-teal px-6 py-2 rounded-full font-subtitle font-bold text-[10px] uppercase tracking-widest hover:bg-teal hover:text-white transition-colors w-full text-center">
               Evaluar
             </a>
          </div>

          {/* Slider Controls Container */}
          <div className="flex items-center gap-4 w-full lg:w-auto overflow-hidden">
             <button className="hidden lg:flex w-10 h-10 rounded-full border border-cream hover:border-teal items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors flex-shrink-0 bg-white">
               <ChevronLeft size={20} />
             </button>

             {/* Reviews List */}
             <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar px-2">
                {reviews.map((ref, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border-t-[6px] border-terracotta min-w-[300px] max-w-[340px] snap-center flex flex-col hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full ${ref.color} text-white flex items-center justify-center font-subtitle font-bold shadow-sm`}>
                             {ref.avatar}
                           </div>
                           <div className="flex flex-col justify-center">
                              <p className="font-subtitle font-bold text-[11px] uppercase tracking-wide text-teal leading-none">{ref.name}</p>
                              <p className="text-[10px] font-subtitle uppercase tracking-widest text-teal/40 mt-1">{ref.time}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex text-[#fbbc04] mb-4 gap-0.5">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <Star key={i} fill="currentColor" stroke="none" size={14} />
                        ))}
                     </div>
                     <p className="font-body text-teal/80 text-lg leading-relaxed">
                        "{ref.text}"
                     </p>
                  </div>
                ))}
             </div>

             <button className="hidden lg:flex w-10 h-10 rounded-full border border-teal/20 items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors flex-shrink-0">
               <ChevronRight size={20} />
             </button>
          </div>
        </div>

      </div>
    </section>
  );
}
