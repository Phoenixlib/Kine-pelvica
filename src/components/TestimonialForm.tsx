export function TestimonialForm() {
  return (
    <section id="contacto" className="py-24 bg-teal">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
        
        <h3 className="font-title text-3xl md:text-4xl text-white mb-4">
          ¡Déjanos tu testimonio o consulta!
        </h3>
        <p className="font-body text-xl text-white/80 mb-10 max-w-2xl mx-auto">
          Nos encantaría saber de tu experiencia. Si deseas dejar un testimonio sobre tu tratamiento, o simplemente tienes una duda, escríbenos aquí.
        </p>

        <form 
          action="mailto:finixterapias@gmail.com" 
          method="POST" 
          encType="text/plain"
          className="bg-offwhite p-8 md:p-12 shadow-xl border-t-[8px] border-terracotta text-left max-w-2xl mx-auto rounded-3xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label htmlFor="name" className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal">Nombre *</label>
                 <input 
                   type="text" 
                   id="name" 
                   name="Nombre" 
                   required
                   className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors" 
                 />
               </div>
               <div className="space-y-2">
                 <label htmlFor="email" className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal">Email *</label>
                 <input 
                   type="email" 
                   id="email" 
                   name="Email" 
                   required
                   className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors" 
                 />
               </div>
            </div>

            <div className="space-y-2">
               <label htmlFor="message" className="font-subtitle text-[10px] tracking-widest uppercase font-bold text-teal">Mensaje o Testimonio *</label>
               <textarea 
                 id="message" 
                 name="Mensaje" 
                 rows={5}
                 required
                 className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors resize-none" 
               ></textarea>
            </div>

            <div className="flex items-start gap-3 bg-cream/10 p-4 rounded-xl border border-cream/50 mt-2">
               <input 
                 type="checkbox" 
                 id="consent" 
                 required
                 className="mt-1 w-4 h-4 rounded border-teal text-teal focus:ring-teal"
               />
               <label htmlFor="consent" className="font-body text-sm text-teal/80 leading-snug">
                 Entiendo que este mensaje será enviado directamente al correo de Camila Ortiz. Consiento voluntariamente que, en caso de ser un testimonio, este podría ser utilizado de forma anónima.
               </label>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-teal text-white rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase hover:bg-teal/90 transition-all shadow-md mt-6"
            >
              Enviar Mensaje
            </button>
          </div>
        </form>

      </div>
    </section>
  );
}
