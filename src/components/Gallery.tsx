"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface GalleryPhoto {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  caption: string | null;
}

interface GalleryProps {
  photos?: GalleryPhoto[] | null;
}

export function Gallery({ photos }: GalleryProps) {
  const [viewingPhoto, setViewingPhoto] = useState<GalleryPhoto | null>(null);

  const fallbackPhotos: GalleryPhoto[] = [
    {
      id: "1",
      beforeUrl: "https://images.unsplash.com/photo-1544365558-35aa4afcf11f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      afterUrl: "https://images.unsplash.com/photo-1544365558-35aa4afcf11f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      caption: "Tratamiento y rehabilitación funcional de cicatrices."
    },
    {
      id: "2",
      beforeUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      afterUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      caption: "Evolución clínica piso pélvico."
    }
  ];

  const displayPhotos = photos || fallbackPhotos;

  if (!displayPhotos || displayPhotos.length === 0) {
    return null;
  }

  return (
    <section id="galeria" className="py-24 bg-teal overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-cream uppercase mb-4">Galería</h2>
          <h3 className="font-title text-4xl md:text-5xl text-white">Antes y <span className="italic font-light text-terracotta">Después</span></h3>
          <p className="font-body text-xl text-white/80 mt-6 max-w-2xl mx-auto">
            Resultados de tratamiento integral de cicatrices y rehabilitación. Cada cuerpo tiene su proceso.
          </p>
        </div>
      </div>
        
      {/* Full Bleed Carousel */}
      <div className="w-full">
        <div className="flex overflow-x-auto gap-6 pb-12 pt-4 snap-x snap-mandatory justify-start px-4 md:px-[calc((100vw-1024px)/2+2rem)] scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {displayPhotos.map((photo) => (
            <div 
              key={photo.id} 
              onClick={() => setViewingPhoto(photo)}
              className="flex-shrink-0 snap-center w-[85vw] sm:w-[340px] md:w-[400px] relative group overflow-hidden rounded-3xl shadow-lg border-[6px] border-white bg-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              
              {/* Image side-by-side view */}
              <div className="grid grid-cols-2 gap-px bg-cream/20 relative aspect-[4/3] w-full">
                <div className="relative h-full overflow-hidden">
                  <img src={photo.beforeUrl} alt="Antes" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-[#0f3f3e]/85 text-white text-[9px] font-subtitle uppercase tracking-widest font-bold px-2.5 py-1 rounded-md">Antes</span>
                </div>
                <div className="relative h-full overflow-hidden">
                  <img src={photo.afterUrl} alt="Después" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-terracotta/90 text-white text-[9px] font-subtitle uppercase tracking-widest font-bold px-2.5 py-1 rounded-md">Después</span>
                </div>
                
                {/* Visual Separator Line */}
                <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white pointer-events-none opacity-80 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg pointer-events-none">
                  <div className="w-1 h-3 border-l border-r border-teal/40"></div>
                </div>
              </div>

              {photo.caption && (
                <div className="p-4 bg-white text-center border-t border-cream/10">
                  <p className="text-xs font-body text-teal/70 italic">"{photo.caption}"</p>
                </div>
              )}
            </div>
          ))}
          
          {/* Invisible spacer to allow last item to scroll to center/start properly */}
          <div className="flex-shrink-0 w-4 md:w-[calc((100vw-1024px)/2)]" aria-hidden="true"></div>
        </div>
      </div>

      {/* Lightbox / Expand Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center flex-col p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setViewingPhoto(null)} 
            className="absolute top-4 right-4 text-white hover:text-white/70 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
          >
            <X size={24} />
          </button>
          
          <div className="w-full max-w-5xl h-full flex flex-col md:flex-row gap-4 items-center justify-center p-4 md:p-8">
            {/* Antes */}
            <div className="w-full h-1/2 md:w-1/2 md:h-full relative flex items-center justify-center bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5">
              <img 
                src={viewingPhoto.beforeUrl} 
                alt="Antes" 
                className="max-w-full max-h-full object-contain" 
              />
              <span className="absolute bottom-4 left-4 bg-black/75 text-white px-3 py-1 rounded-md font-subtitle text-[10px] uppercase tracking-widest font-bold">
                Antes
              </span>
            </div>
            
            {/* Después */}
            <div className="w-full h-1/2 md:w-1/2 md:h-full relative flex items-center justify-center bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5">
              <img 
                src={viewingPhoto.afterUrl} 
                alt="Después" 
                className="max-w-full max-h-full object-contain" 
              />
              <span className="absolute bottom-4 right-4 bg-terracotta/90 text-white px-3 py-1 rounded-md font-subtitle text-[10px] uppercase tracking-widest font-bold">
                Después
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
