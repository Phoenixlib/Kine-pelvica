export function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-[100svh] flex flex-col items-center justify-center bg-teal overflow-hidden pt-28 pb-16 md:pt-20 md:pb-12"
    >
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-cream) 0.5px, transparent 0.5px)",
          backgroundSize: "30px 30px",
        }}
      ></div>
      <div className="absolute top-0 right-0 w-[50%] h-full bg-cream/5 -z-10"></div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-4xl mt-0">
        {/* Large Central Logo */}
        <div className="mb-6 md:mb-10 w-full max-w-[280px] sm:max-w-xs md:max-w-md lg:max-w-lg">
          <img
            src="/Logo-completo-editado.png"
            alt="Estudio Pélvico Camila Ortiz"
            className="w-full h-auto object-contain mx-auto transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Hero Text */}
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="font-body text-lg md:text-xl lg:text-3xl text-white/90 font-light leading-relaxed">
            Especialista en uroginecología, embarazo, postparto, sexualidad
            terapéutica y tratamiento integral de cicatrices en adultos, niños y
            embarazadas.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <a
            href="#servicios"
            className="px-8 py-3.5 bg-cream text-teal text-[11px] uppercase tracking-widest font-bold rounded-full hover:bg-white transition-all shadow-md w-full sm:w-auto text-center"
          >
            Conoce Mis Servicios
          </a>
          <a
            href="#servicios"
            className="px-8 py-3.5 bg-transparent border border-cream text-cream text-[11px] uppercase tracking-widest font-bold rounded-full hover:bg-cream/10 transition-all w-full sm:w-auto text-center"
          >
            Agendar Cita
          </a>
        </div>
      </div>
    </section>
  );
}
