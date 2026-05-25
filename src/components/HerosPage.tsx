import { LogoSVG } from "./Logo";

export function HerosPage() {
  return (
    <div className="pt-24 bg-offwhite min-h-screen">
      <div className="container mx-auto px-4 pb-12">
        <h1 className="font-title text-4xl md:text-5xl text-teal text-center mb-8">
          Opciones de Portada (Hero)
        </h1>
        <p className="font-body text-xl text-teal/80 text-center max-w-2xl mx-auto mb-16">
          Aquí puedes revisar diferentes estilos para la sección principal de tu página web. Selecciona la que más te guste para tu sitio oficial.
        </p>

        <div className="space-y-32">
          {/* Opción 1: Actual pero con variante de color */}
          <div className="border-[8px] border-cream bg-white shadow-xl rounded-3xl overflow-hidden relative">
            <div className="absolute top-4 left-4 bg-terracotta text-white font-subtitle text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-full z-20">
              Opción 1: Centrado Minimalista (Actual)
            </div>
            {/* Contenido Hero */}
            <div className="relative min-h-[70vh] flex flex-col items-center justify-center bg-teal overflow-hidden py-20 pointer-events-none">
              
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--color-cream) 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
              <div className="absolute top-0 right-0 w-[50%] h-full bg-cream/5 -z-10"></div>
              
              <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-4xl">
                <div className="text-white mb-6 md:mb-10">
                   <LogoSVG className="text-white scale-75 md:scale-100" />
                </div>
                <div className="max-w-2xl mx-auto space-y-6">
                  <p className="font-body text-lg md:text-xl lg:text-3xl text-white/90 font-light leading-relaxed">
                    Especialista en uroginecología, embarazo, postparto, sexualidad terapéutica y tratamiento integral de cicatrices.
                  </p>
                </div>
                <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <div className="px-8 py-3.5 bg-cream text-teal text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center">Conoce Mis Servicios</div>
                  <div className="px-8 py-3.5 bg-transparent border border-cream text-cream text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center">Agendar Evaluación</div>
                </div>
              </div>
            </div>
          </div>

          {/* Opción 2: Imagen a pantalla dividida */}
          <div className="border-[8px] border-cream bg-white shadow-xl rounded-3xl overflow-hidden relative">
            <div className="absolute top-4 left-4 bg-terracotta text-white font-subtitle text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-full z-20">
              Opción 2: Pantalla Dividida (Moderna)
            </div>
            {/* Contenido Hero */}
            <div className="relative min-h-[70vh] flex flex-col lg:flex-row bg-[#f7f3ef] overflow-hidden pointer-events-none">
              <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 lg:py-0">
                <div className="text-teal mb-6 md:mb-8 flex items-center gap-4">
                  <LogoSVG size="small" className="text-teal m-0" />
                </div>
                <p className="font-body text-lg md:text-xl text-teal/80 font-light leading-relaxed mb-10 max-w-lg">
                  Especialista en uroginecología, embarazo, postparto, sexualidad terapéutica y tratamiento integral de cicatrices en adultos, niños y embarazadas.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="px-8 py-3.5 bg-teal text-white text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center shadow-md">Agendar Evaluación</div>
                  <div className="px-8 py-3.5 bg-transparent border border-teal text-teal text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center">Conoce Mis Servicios</div>
                </div>
              </div>
              <div className="w-full lg:w-1/2 min-h-[300px] lg:min-h-full bg-teal relative">
                <img src="https://images.unsplash.com/photo-1544365558-35aa4afcf11f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Studio" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"/>
              </div>
            </div>
          </div>

          {/* Opción 3: Limpio con imagen suavizada */}
          <div className="border-[8px] border-cream bg-white shadow-xl rounded-3xl overflow-hidden relative">
            <div className="absolute top-4 left-4 bg-terracotta text-white font-subtitle text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-full z-20">
              Opción 3: Imagen de Fondo Suavizada
            </div>
            {/* Contenido Hero */}
            <div className="relative min-h-[70vh] flex flex-col items-center justify-center bg-teal overflow-hidden py-20 pointer-events-none">
              <img src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1200&auto=format&fit=crop" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-15" />
              <div className="absolute inset-0 bg-gradient-to-t from-teal via-teal/80 to-transparent"></div>
              
              <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-4xl mt-12">
                <div className="text-white mb-8">
                   <LogoSVG className="text-white scale-75 md:scale-100" />
                </div>
                <div className="max-w-2xl mx-auto space-y-6 bg-teal/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
                  <p className="font-body text-xl md:text-2xl text-white font-light leading-relaxed">
                    Especialista en uroginecología, embarazo, postparto, sexualidad terapéutica y tratamiento integral de cicatrices en adultos, niños y embarazadas.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    <div className="px-8 py-3.5 bg-cream text-teal text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center shadow-md">Agendar Evaluación</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opción 4: Diseño asimétrico con tarjeta superpuesta */}
          <div className="border-[8px] border-cream bg-white shadow-xl rounded-3xl overflow-hidden relative">
            <div className="absolute top-4 left-4 bg-terracotta text-white font-subtitle text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-full z-20">
              Opción 4: Estilo Editorial (Asimétrico)
            </div>
            {/* Contenido Hero */}
            <div className="relative min-h-[70vh] bg-offwhite flex items-center justify-center py-20 lg:py-0 px-4 pointer-events-none">
              <div className="container mx-auto max-w-6xl relative z-10 flex flex-col lg:flex-row items-center gap-10">
                {/* Image Block */}
                <div className="w-full lg:w-5/12 order-2 lg:order-1 relative">
                  <div className="aspect-[3/4] md:aspect-square lg:aspect-[3/4] rounded-t-full rounded-b-full overflow-hidden shadow-2xl relative border-8 border-white">
                    <img src="https://images.unsplash.com/photo-1600618528240-fb9fc964b853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Studio" className="w-full h-full object-cover" />
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-cream rounded-full -z-10"></div>
                </div>
                
                {/* Text Block */}
                <div className="w-full lg:w-7/12 order-1 lg:order-2 lg:-ml-12 lg:mt-24 z-10">
                  <div className="bg-teal p-8 md:p-12 lg:p-16 rounded-3xl shadow-xl flex flex-col items-start text-left">
                    <LogoSVG size="small" className="text-white mb-8 m-0 items-start [&>svg]:mx-0 [&>div]:text-left [&>div>p]:tracking-[0.2em]" />
                    <h2 className="font-title text-3xl md:text-4xl lg:text-5xl text-white mb-6 leading-tight">
                      Bienestar Inclusivo, <span className="text-terracotta italic font-light">Integral</span> y Actualizado.
                    </h2>
                    <p className="font-body text-lg text-white/80 font-light leading-relaxed mb-10 max-w-lg">
                      Especialista en uroginecología, embarazo, postparto, sexualidad terapéutica y tratamiento integral de cicatrices en adultos, niños y embarazadas.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                      <div className="px-8 py-3.5 bg-cream text-teal text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center shadow-md">Agendar Evaluación</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Opción 5: Tipografía Gigante */}
          <div className="border-[8px] border-cream bg-white shadow-xl rounded-3xl overflow-hidden relative">
            <div className="absolute top-4 left-4 bg-terracotta text-white font-subtitle text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-full z-20">
              Opción 5: Tipografía Gigante (Orgánico)
            </div>
            {/* Contenido Hero */}
            <div className="relative min-h-[70vh] flex flex-col items-center justify-center bg-[#f2ede6] overflow-hidden py-24 pointer-events-none">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-teal) 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>
              
              <div className="container mx-auto px-4 relative z-10 text-center flex flex-col items-center">
                <LogoSVG size="small" className="text-teal mb-8" />
                
                <h1 className="font-title text-[clamp(2.5rem,6vw,5.5rem)] text-teal leading-[1.05] tracking-tight mb-8 max-w-5xl mx-auto">
                  Salud pélvica <span className="italic text-terracotta font-light">integral</span> para todas las etapas de la vida.
                </h1>
                
                <p className="font-body text-lg md:text-xl text-teal/70 font-light leading-relaxed mb-12 max-w-2xl mx-auto">
                  Uroginecología, embarazo, postparto, sexualidad terapéutica y tratamiento integral de cicatrices desde una mirada compasiva.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <div className="px-10 py-4 bg-teal text-white text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center shadow-lg">Agendar Evaluación</div>
                  <div className="px-10 py-4 bg-transparent border-2 border-teal/20 text-teal hover:border-teal text-[11px] uppercase tracking-widest font-bold rounded-full w-full sm:w-auto text-center">Conoce Mis Servicios</div>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div className="mt-20 text-center">
          <p className="font-body text-xl text-teal mb-6">¿Cuál te gusta más?</p>
          <a href="/#" className="inline-block px-10 py-4 bg-terracotta text-white font-subtitle text-[11px] tracking-widest font-bold uppercase rounded-full hover:bg-teal transition-all shadow-md">
            Volver al Inicio
          </a>
        </div>
      </div>
    </div>
  );
}
