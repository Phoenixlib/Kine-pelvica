"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    if (scrollWidth > clientWidth) {
      const scrolled = (scrollLeft / (scrollWidth - clientWidth)) * 100;
      setScrollProgress(scrolled);
    } else {
      setScrollProgress(0);
    }
  };

  const scrollLeftManual = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" });
    }
  };

  const scrollRightManual = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [displayPhotos]);

  const closePreview = () => setSelectedIdx(null);
  
  const nextPhoto = () => {
    if (selectedIdx !== null && selectedIdx < displayPhotos.length - 1) {
      setSelectedIdx(selectedIdx + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedIdx !== null && selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  if (!displayPhotos || displayPhotos.length === 0) {
    return null;
  }

  const selectedPhoto = selectedIdx !== null ? displayPhotos[selectedIdx] : null;

  return (
    <section id="galeria" className="py-24 bg-teal overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left"
          >
            <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-cream uppercase mb-4">Galería</h2>
            <h3 className="font-title text-4xl md:text-5xl text-white">Antes y <span className="italic font-light text-terracotta">Después</span></h3>
            <p className="font-body text-xl text-white/80 mt-6 max-w-2xl">
              Resultados de tratamiento integral de cicatrices y rehabilitación. Cada cuerpo tiene su proceso.
            </p>
          </motion.div>

          {/* Flechas de Navegación del Carrusel */}
          {displayPhotos.length > 1 && (
            <div className="flex justify-center md:justify-end gap-3 pb-2">
              <button
                onClick={scrollLeftManual}
                className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 transform active:scale-95 flex items-center justify-center text-white"
                aria-label="Desplazar a la izquierda"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollRightManual}
                className="p-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 transform active:scale-95 flex items-center justify-center text-white"
                aria-label="Desplazar a la derecha"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Contained Carousel */}
        <div className="w-full relative">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto gap-6 pb-6 pt-4 snap-x snap-mandatory justify-start px-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {displayPhotos.map((photo, idx) => (
              <motion.div 
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                onClick={() => setSelectedIdx(idx)}
                className="flex-shrink-0 snap-start w-[85vw] sm:w-[320px] md:w-[380px] lg:w-[400px] relative aspect-[4/3] rounded-[2rem] overflow-hidden group cursor-pointer border-[4px] border-cream/10 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white"
              >
                
                {/* Image side-by-side view */}
                <div className="grid grid-cols-2 gap-px bg-black relative w-full h-full">
                  <div className="relative h-full overflow-hidden">
                    <img src={photo.beforeUrl} alt="Antes" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-subtitle uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-white/10">Antes</span>
                  </div>
                  <div className="relative h-full overflow-hidden">
                    <img src={photo.afterUrl} alt="Después" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute top-4 right-4 bg-terracotta/90 backdrop-blur-md text-white text-[9px] font-subtitle uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg">Después</span>
                  </div>
                  
                  {/* Visual Separator Line */}
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white pointer-events-none opacity-50"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xl pointer-events-none border-[3px] border-black/10">
                    <div className="w-1 h-3 border-l border-r border-teal/30"></div>
                  </div>

                  {/* Subtle Elegant Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 z-10">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-cream/90 mb-2">
                      Ver Detalle ✦
                    </span>
                    {photo.caption && (
                      <p className="text-white text-sm font-medium leading-relaxed line-clamp-2">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Invisible spacer removed, no longer needed inside a fixed container */}
          </div>

          {/* Barra de progreso de desplazamiento sutil */}
          {displayPhotos.length > 1 && (
            <div className="mt-8 max-w-xs mx-auto h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150 ease-out bg-cream"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md select-none"
            onClick={closePreview}
          >
            {/* Botón de Cerrar */}
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[120] p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300"
              aria-label="Cerrar vista"
            >
              <X size={20} />
            </button>

            {/* Flecha Izquierda (Anterior) */}
            {displayPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                disabled={selectedIdx === 0}
                className={`absolute left-2 sm:left-6 z-[120] p-3 text-white/75 bg-white/5 backdrop-blur-md rounded-full transition-all duration-300 border border-white/5 ${selectedIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95'}`}
                aria-label="Foto anterior"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Flecha Derecha (Siguiente) */}
            {displayPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                disabled={selectedIdx === displayPhotos.length - 1}
                className={`absolute right-2 sm:right-6 z-[120] p-3 text-white/75 bg-white/5 backdrop-blur-md rounded-full transition-all duration-300 border border-white/5 ${selectedIdx === displayPhotos.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95'}`}
                aria-label="Siguiente foto"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Container Principal de la Imagen */}
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-6xl max-h-[90vh] flex flex-col items-center justify-center px-12 sm:px-16"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animación del cambio de imagen usando wait mode */}
              <div className="relative w-full h-full flex flex-col md:flex-row gap-2 sm:gap-4 items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`before-${selectedPhoto.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="w-full h-[40vh] md:w-1/2 md:h-[75vh] relative flex items-center justify-center bg-zinc-900/60 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                  >
                    <img 
                      src={selectedPhoto.beforeUrl} 
                      alt="Antes" 
                      className="max-w-full max-h-full object-contain pointer-events-none" 
                    />
                    <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-subtitle text-[10px] uppercase tracking-widest font-bold border border-white/10 shadow-lg">
                      Antes
                    </span>
                  </motion.div>
                </AnimatePresence>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`after-${selectedPhoto.id}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="w-full h-[40vh] md:w-1/2 md:h-[75vh] relative flex items-center justify-center bg-zinc-900/60 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                  >
                    <img 
                      src={selectedPhoto.afterUrl} 
                      alt="Después" 
                      className="max-w-full max-h-full object-contain pointer-events-none" 
                    />
                    <span className="absolute top-4 right-4 bg-terracotta/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-subtitle text-[10px] uppercase tracking-widest font-bold shadow-lg">
                      Después
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Texto explicativo en el footer del modal */}
              <AnimatePresence mode="wait">
                {selectedPhoto.caption && (
                  <motion.div
                    key={`caption-${selectedPhoto.id}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6 text-center w-full max-w-2xl"
                  >
                    <p className="text-white/90 text-sm md:text-base font-body tracking-wide bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-xl inline-block">
                      {selectedPhoto.caption}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
