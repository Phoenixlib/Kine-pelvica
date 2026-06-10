"use client";

import { useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

export function Reviews() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = direction === "left" ? -420 : 420;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const reviews = [
    {
      name: "yanitza baeza salgado",
      avatar: "Y",
      color: "bg-blue-500",
      text: "Totalmente agradable, discreto, de confianza total con la kine , 1000000% recomendado!!! Me ayudó muchísimo en mi pre y post parto! 🙌♥️ mi kine Camila Ortiz sequisima y aparte de eso, creamos un ambiente tan bonito donde me siento en confianza y hasta me desestresa nuestras conversaciones 🤭",
    },
    {
      name: "lilian ramirez",
      avatar: "L",
      color: "bg-teal",
      text: "Mi experiencia con la kinesióloga Camila Ortiz ha sido muy buena. Excelente atención. Explica muy bien cualquier duda que tenga amablemente. Dá confianza y muy profesional en su trabajo. La recomiendo al 100%.",
    },
    {
      name: "Sabriii Ve",
      avatar: "S",
      color: "bg-terracotta",
      text: "Gracias a la mejor en piso pélvico, gracias a la terapia y a la confianza que me brindó, pude tener calidad de vida, mejorar cosas en mi, y sobre todo se que para la próxima puedo acudir nuevamente para que todo sea seguro en el proceso que esté pasando ❤️",
    },
  ];

  return (
    <section id="testimonios" className="py-24 bg-cream">
      <div className="container mx-auto px-4 lg:px-8">
        
        <div className="text-center mb-16">
          <p className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-2">Testimonios</p>
          <h3 className="font-title text-4xl md:text-5xl text-teal">Qué dicen <span className="italic font-light text-terracotta">nuestros pacientes</span></h3>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          
          {/* Summary Box */}
          <div className="flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow-xl border-4 border-white min-w-[260px] relative z-10">
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
               5.0 | Reseñas Reales
             </p>
             <a href="https://search.google.com/local/writereview?placeid=ChIJRbsg_E4VUpERWEsDb_n9txA" target="_blank" rel="noopener noreferrer" className="mt-4 border border-teal text-teal px-6 py-2 rounded-full font-subtitle font-bold text-[10px] uppercase tracking-widest hover:bg-teal hover:text-white transition-colors w-full text-center">
               Evaluar
             </a>
          </div>

          {/* Slider Controls Container */}
          <div className="flex items-center gap-2 w-full lg:flex-1 relative min-w-0">
             <button 
               onClick={() => scroll('left')}
               className="hidden lg:flex w-10 h-10 rounded-full border border-teal/20 hover:border-teal items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors flex-shrink-0 bg-white z-10"
             >
               <ChevronLeft size={20} />
             </button>

             {/* Reviews List with Mask */}
             <div 
               className="flex-1 min-w-0 overflow-hidden"
               style={{ 
                 WebkitMaskImage: 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)',
                 maskImage: 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)'
               }}
             >
               <div 
                 ref={scrollContainerRef}
                 className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar px-8"
               >
                  {reviews.map((ref, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border-t-[6px] border-terracotta min-w-[320px] md:min-w-[420px] snap-center flex flex-col hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full ${ref.color} text-white flex items-center justify-center font-subtitle font-bold shadow-sm`}>
                               {ref.avatar}
                             </div>
                             <div className="flex flex-col justify-center">
                                <p className="font-subtitle font-bold text-[11px] uppercase tracking-wide text-teal leading-none">{ref.name}</p>
                                {"time" in ref && ref.time && (
                                  <p className="text-[10px] font-subtitle uppercase tracking-widest text-teal/40 mt-1">{ref.time}</p>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="flex text-[#fbbc04] mb-4 gap-0.5">
                          {[1, 2, 3, 4, 5].map((_, i) => (
                            <Star key={i} fill="currentColor" stroke="none" size={14} />
                          ))}
                       </div>
                       <p className="font-body text-teal/80 text-base md:text-lg leading-relaxed">
                          "{ref.text}"
                       </p>
                    </div>
                  ))}
               </div>
             </div>

             <button 
               onClick={() => scroll('right')}
               className="hidden lg:flex w-10 h-10 rounded-full border border-teal/20 hover:border-teal items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors flex-shrink-0 bg-white z-10"
             >
               <ChevronRight size={20} />
             </button>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <a href="https://www.google.com/search?hl=es-CL&gl=cl&q=Kinesi%C3%B3loga+de+piso+p%C3%A9lvico+%E2%80%93+Camila+Ortiz+%7C+Iquique+-+Benigno+Posadas+1884,+1110773+Iquique,+Tarapac%C3%A1&ludocid=1204710673096067928&lsig=AB86z5XBtzM9NRImearcz_h_dimU#lrd=" target="_blank" rel="noopener noreferrer" className="border border-teal bg-teal text-white px-8 py-3 rounded-full font-subtitle font-bold text-[11px] uppercase tracking-widest hover:bg-teal/90 transition-colors text-center inline-block">
            Ver más reseñas en Google
          </a>
        </div>

      </div>
    </section>
  );
}
