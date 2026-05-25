import { ChevronRight } from "lucide-react";

export function Gallery() {
  return (
    <section id="galeria" className="py-24 bg-teal">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-cream uppercase mb-4">Galería</h2>
          <h3 className="font-title text-4xl md:text-5xl text-white">Antes y <span className="italic font-light text-terracotta">Después</span></h3>
          <p className="font-body text-xl text-white/80 mt-6 max-w-2xl mx-auto">
            Resultados de tratamiento integral de cicatrices y rehabilitación. Cada cuerpo tiene su proceso.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-lg border-[6px] border-white max-w-md mx-auto w-full">
            <div className="aspect-[4/3] bg-teal/5 flex items-center justify-center relative">
               <img 
                  src="https://images.unsplash.com/photo-1544365558-35aa4afcf11f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Evolución de tratamiento"
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                />
                {/* Fake slider line */}
                <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white pointer-events-none opacity-80 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg pointer-events-none">
                   <div className="w-1 h-3 border-l border-r border-teal/40"></div>
                </div>
            </div>
            <div className="absolute inset-0 bg-teal/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
               <span className="text-white font-subtitle font-medium text-sm tracking-widest uppercase border border-white px-6 py-3 rounded-full backdrop-blur-sm">Ver Caso Completo</span>
            </div>
          </div>
          
          <div className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-lg border-[6px] border-white max-w-md mx-auto w-full">
            <div className="aspect-[4/3] bg-teal/5 flex items-center justify-center relative">
               <img 
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Evolución de tratamiento"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white pointer-events-none opacity-80 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg pointer-events-none">
                   <div className="w-1 h-3 border-l border-r border-teal/40"></div>
                </div>
            </div>
            <div className="absolute inset-0 bg-teal/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
               <span className="text-white font-subtitle font-medium text-sm tracking-widest uppercase border border-white px-6 py-3 rounded-full backdrop-blur-sm">Ver Caso Completo</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a href="#contacto" className="inline-block px-10 py-3.5 border-2 border-cream text-cream rounded-full font-subtitle text-[11px] uppercase tracking-widest font-bold hover:bg-cream hover:text-teal transition-colors shadow-sm">
            Consultar por tu caso
          </a>
        </div>
      </div>
    </section>
  );
}
