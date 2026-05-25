export function About() {
  return (
    <section id="quien-soy" className="py-24 bg-cream">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Image Side */}
          <div className="w-full lg:w-1/2 relative flex justify-center">
            <div className="w-[85%] aspect-[4/5] rounded-[100px] overflow-hidden border-[12px] border-offwhite shadow-2xl relative z-10 bg-offwhite/30 flex items-center justify-center">
               {/* Placeholder for actual photo */}
               <img 
                 src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                 alt="Camila Ortiz - Kinesióloga" 
                 className="w-full h-full object-cover object-top opacity-90 mix-blend-multiply"
               />
               <div className="absolute inset-0 bg-offwhite/10 mix-blend-overlay"></div>
            </div>
            {/* Decorative background shape */}
            <div className="absolute -bottom-8 -left-4 w-64 h-64 bg-offwhite mask-radial blur-3xl -z-10 opacity-50"></div>
          </div>

          {/* Text Side */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-4">Quién Soy</h2>
            <h3 className="font-title text-4xl md:text-5xl text-teal mb-6 leading-[1.1]">
              Acompañando tu bienestar <br/><span className="italic font-light text-terracotta">en cada etapa.</span>
            </h3>
            
            <div className="space-y-6 text-lg text-teal/80 font-body font-light leading-relaxed">
              <p>
                Soy Camila Ortiz, Kinesióloga especialista en piso pélvico, ubicada en Iquique. Mi propósito es brindar una atención integral, cercana y empática a mujeres, hombres y niños que busquen mejorar su calidad de vida íntima y funcional.
              </p>
              <p>
                A través de años de especialización en <strong>uroginecología, embarazo, postparto y sexualidad terapéutica</strong>, he desarrollado un enfoque centrado en la persona, donde cada tratamiento es diseñado específicamente para tus necesidades únicas.
              </p>
              <p>
                Además, ofrezco <strong>tratamiento integral de cicatrices</strong> para ayudar a tu cuerpo a sanar adecuadamente, restaurar la movilidad y reducir las molestias asociadas a procesos quirúrgicos o traumáticos.
              </p>
            </div>

            <div className="mt-10">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Firma_Camila.svg/1200px-Firma_Camila.svg.png" 
                alt="Firma Camila" 
                className="h-16 opacity-60 mix-blend-multiply grayscale contrast-200 brightness-0 sepia" 
                style={{ filter: 'brightness(0) sepia(1) hue-rotate(150deg) saturate(0.5) opacity(0.8)'}}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
