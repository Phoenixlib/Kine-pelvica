import { MapPin, Phone, Mail } from "lucide-react";
import { LogoSVG } from "./Logo";
import { db } from "~/server/db";

export async function Footer() {
  const configs = await db.siteConfig.findMany({
    where: {
      key: {
        in: ['whatsapp_number', 'instagram_url', 'facebook_url', 'email_address', 'address']
      }
    }
  });

  const configMap: Record<string, string> = {};
  configs.forEach(c => { configMap[c.key] = c.value; });

  const whatsapp = configMap['whatsapp_number'] || "+56 9 5084 0767";
  const instagram = configMap['instagram_url'] || "#";
  const facebook = configMap['facebook_url'] || "#";
  const email = configMap['email_address'] || "finixterapias@gmail.com";
  const address = configMap['address'] || "Benigno Posadas 1884<br/>Iquique, Chile";

  return (
    <footer className="bg-[#0f3f3e] text-[#f7f3ef] border-t border-[#0f3f3e]">
      <div className="container mx-auto px-4 lg:px-12 py-16">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 justify-between">
          
          {/* Brand Col */}
          <div className="flex flex-col items-start lg:col-span-1">
             <a href="/login" aria-label="Acceso administrativo" className="block">
                <LogoSVG size="small" className="text-[#f7f3ef] mb-6 grayscale brightness-200 contrast-200 mix-blend-screen" />
             </a>
             <p className="font-body text-sm text-[#f7f3ef]/70 mb-6 leading-relaxed max-w-xs">
                Especialista en uroginecología, embarazo, postparto y tratamiento integral de cicatrices.
             </p>
             <div className="flex gap-4">
               {instagram !== '#' && (
                 <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-[#f7f3ef]/60 hover:text-terracotta transition-colors" aria-label="Instagram">
                   <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                     <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                   </svg>
                 </a>
               )}
               {facebook !== '#' && (
                 <a href={facebook} target="_blank" rel="noopener noreferrer" className="text-[#f7f3ef]/60 hover:text-terracotta transition-colors" aria-label="Facebook">
                   <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                     <path d="M9 8H7v3h2v9h4v-9h3.682L17 8h-3V6.72c0-.767.185-1.094.943-1.094H17V2h-2.912C11.166 2 9 3.512 9 6.883V8z"/>
                   </svg>
                 </a>
               )}
             </div>
          </div>

          {/* Navigation */}
          <div className="lg:mx-auto">
             <h4 className="font-subtitle font-bold tracking-[0.2em] text-[10px] uppercase text-[#f7f3ef]/50 mb-6">Navegación</h4>
             <ul className="space-y-4 font-subtitle text-xs uppercase tracking-widest text-[#f7f3ef]/90">
                <li><a href="/#inicio" className="hover:text-terracotta transition-colors">Inicio</a></li>
                <li><a href="/#quien-soy" className="hover:text-terracotta transition-colors">Quién Soy</a></li>
                <li><a href="/#servicios" className="hover:text-terracotta transition-colors">Servicios</a></li>
                <li><a href="/#galeria" className="hover:text-terracotta transition-colors">Antes y Después</a></li>
                <li><a href="/#testimonios" className="hover:text-terracotta transition-colors">Testimonios</a></li>
                <li><a href="/blog" className="hover:text-terracotta transition-colors">Blog</a></li>
                <li><a href="/#buzon" className="hover:text-terracotta transition-colors">Buzón Comunidad</a></li>
             </ul>
          </div>

          {/* Info */}
          <div>
             <h4 className="font-subtitle font-bold tracking-[0.2em] text-[10px] uppercase text-[#f7f3ef]/50 mb-6">Información</h4>
             <ul className="space-y-4 font-body text-sm text-[#f7f3ef]/80">
                <li className="flex gap-3 items-start group cursor-default">
                   <MapPin className="text-terracotta flex-shrink-0 mt-0.5 group-hover:-translate-y-1 transition-transform" size={18} />
                   <span className="leading-snug" dangerouslySetInnerHTML={{ __html: address }}></span>
                </li>
                <li className="flex gap-3 items-start group cursor-pointer hover:text-terracotta transition-colors">
                   <Phone className="text-terracotta flex-shrink-0 mt-0.5 group-hover:-translate-y-1 transition-transform" size={18} />
                   <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                     <span>{whatsapp}</span>
                   </a>
                </li>
                <li className="flex gap-3 items-start group cursor-pointer hover:text-terracotta transition-colors">
                   <Mail className="text-terracotta flex-shrink-0 mt-0.5 group-hover:-translate-y-1 transition-transform" size={18} />
                   <a href={`mailto:${email}`}>
                     <span>{email}</span>
                   </a>
                </li>
             </ul>
          </div>

          {/* CTA */}
          <div className="bg-[#134948] p-6 lg:p-8 rounded-3xl lg:col-span-1 border border-[#f7f3ef]/10 flex flex-col justify-center">
             <h4 className="font-subtitle tracking-[0.2em] text-[10px] font-bold uppercase text-[#f7f3ef]/50 mb-2">
                Evaluaciones
             </h4>
             <p className="font-title text-2xl text-[#f7f3ef] mb-6">Agenda tu hora</p>
             <a href="/#servicios" className="inline-flex w-fit items-center justify-center px-6 py-3 bg-terracotta text-white rounded-full font-subtitle text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-terracotta transition-colors shadow-sm">
                Agendar ahora
             </a>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#134948] flex flex-col md:flex-row items-center justify-between font-subtitle text-[10px] tracking-widest uppercase text-[#f7f3ef]/40 gap-4 text-center md:text-left">
          <p>© {new Date().getFullYear()} Estudio Pélvico Camila Ortiz. Todos los derechos reservados. Desarrollado por FinixDev</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/politicas-de-atencion" className="hover:text-terracotta transition-colors">Términos de atención</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
