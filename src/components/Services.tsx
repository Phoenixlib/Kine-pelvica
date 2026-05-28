"use client";

import { useState } from "react";

interface Service {
  name: string;
  price: string | number;
  duration?: string | number;
  details?: string | null;
  bookingUrl?: string | null;
}

interface ServiceCategory {
  name: string;
  services: Service[];
}

interface ServicesProps {
  initialCategories?: ServiceCategory[] | null;
}

export function Services({ initialCategories }: ServicesProps) {
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const fallbackCategories: ServiceCategory[] = [
    {
      name: "ATENCIONES PÉLVICAS",
      services: [
        { name: "Evaluación pélvica", price: 35000, duration: 60, details: "Primera sesión pélvica. Conoceremos el enfoque del tratamiento según las necesidades..." },
        { name: "Hipopresivos", price: 30000, duration: 40, details: "Clase individual o grupal" },
        { name: "Control pélvico", price: 30000, duration: 60, details: "Sesión posterior a una evaluación pélvica 👩🏻‍⚕️" }
      ]
    },
    {
      name: "PREPARACIÓN DURANTE EL EMBARAZO",
      services: [
        { name: "Evaluación pélvica en el embarazo", price: 35000, duration: 40, details: "Se realiza una evaluación pélvica abdominal completa. Realizando ademas una evaluación de ph vaginal que permite conocer el estado..." },
        { name: "Gimnasia pre natal", price: 30000, duration: 40, details: "Clase grupal de 1-3 personas, la sesión se puede compartir con personas no embarazadas y le aumentamos las cargas." },
        { name: "Control embarazo", price: 30000, duration: 60, details: "Prepara tu cuerpo para que quede con los menos daños posibles durante tu embarazo ✨" },
        { name: "Taller embarazo: práctica de pujos", price: 30000, duration: 60, details: "Sesión dedicada a la educación del puño fisiológico y cómo podemos evitar desgarros durante la realización de ellos..." },
        { name: "Taller junto a pareja: manejo del dolor y qué hacer el día del nacimiento", price: 30000, duration: 40, details: "Sesión dedicada a entregar herramientas al acompañante..." }
      ]
    },
    {
      name: "DRENAJE-CICATRICES-MASAJES",
      services: [
        { name: "Manejo de cicatrices", price: 30000, duration: 60, details: "Tratamiento de cicatrices de cualquier zona del cuerpo." },
        { name: "Drenaje linfático", price: 30000, duration: 60, details: "- Post operatorios\n- Embarazos" },
        { name: "Masaje descontracturante", price: 30000, duration: 60, details: "Justo y necesario 🙌🏻" }
      ]
    },
    {
      name: "RESPIRATORIO",
      services: [
        { name: "Kinesiterapia respiratoria infantil", price: 30000, duration: 40, details: "Realizadas con amor y cariño + educación a padres y manejo en casa" }
      ]
    },
    {
      name: "Servicios empresas",
      services: [
        { name: "Charla corporativa educativa", price: 40000, duration: 60, details: "" }
      ]
    }
  ];

  const categories = initialCategories || fallbackCategories;

  // Protect against empty category lists
  if (!categories || categories.length === 0) {
    return null;
  }

  // Handle activeCategory out of bounds if initialCategories has fewer categories than state index
  const safeActiveIndex = activeCategory >= categories.length ? 0 : activeCategory;
  const currentCategory = categories[safeActiveIndex];

  const formatPrice = (price: string | number) => {
    if (typeof price === "number") {
      return `$${price.toLocaleString("es-CL")}`;
    }
    return price;
  };

  const formatDuration = (duration?: string | number) => {
    if (duration === undefined || duration === null || duration === "") return "";
    if (typeof duration === "number") {
      return `${duration} min`;
    }
    return duration;
  };

  return (
    <section id="servicios" className="py-24 bg-offwhite">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        
        <div className="text-center mb-16">
          <h2 className="text-[11px] font-subtitle font-bold tracking-[0.2em] text-redbrown uppercase mb-4">Agenda</h2>
          <h3 className="font-title text-4xl md:text-5xl text-teal mb-6">Nuestros <span className="italic font-light text-terracotta">Servicios</span></h3>
          <p className="font-body text-xl text-teal/80 max-w-2xl mx-auto">
            Encuentra el tratamiento ideal para tu necesidad y agenda directamente.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(index)}
              className={`px-6 py-3 rounded-full font-subtitle text-[11px] md:text-xs uppercase tracking-widest font-bold transition-all ${
                safeActiveIndex === index 
                  ? "bg-teal text-white shadow-md border border-teal" 
                  : "bg-white text-teal border border-cream hover:bg-cream/20"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {currentCategory && (
          <div className="bg-[#f7f3ef] border border-cream/50 rounded-3xl p-6 md:p-10 shadow-sm min-h-[400px]">
            <h4 className="font-subtitle text-lg font-bold text-teal mb-8 text-center uppercase tracking-widest hidden md:block">
              {currentCategory.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 fade-in duration-500" key={safeActiveIndex}>
              {currentCategory.services.map((service, sIndex) => (
                <div key={sIndex} className="bg-white border border-terracotta/20 rounded-2xl p-6 flex flex-col hover:border-terracotta/50 hover:shadow-md transition-all h-full relative group">
                  <div className="flex-1">
                    <h4 className="font-subtitle text-[13px] font-bold text-[#0f3f3e] mb-1">{service.name}</h4>
                    <div className="font-body text-sm text-[#0f3f3e]/60 mb-2 flex justify-between items-center">
                      {service.duration && <span>{formatDuration(service.duration)}</span>}
                      <span className="font-bold text-terracotta text-base">{formatPrice(service.price)}</span>
                    </div>
                    {service.details && (
                      <p className="font-body text-xs text-[#0f3f3e]/70 leading-relaxed mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
                        {service.details}
                      </p>
                    )}
                    {!service.details && <div className="mb-4"></div>}
                  </div>
                  <a 
                    href={service.bookingUrl || "#contacto"} 
                    target={service.bookingUrl ? "_blank" : undefined}
                    rel={service.bookingUrl ? "noopener noreferrer" : undefined}
                    className="mt-auto block text-center bg-terracotta text-white py-2.5 rounded-full font-subtitle text-[10px] uppercase tracking-widest font-bold hover:bg-teal transition-colors shadow-sm"
                  >
                    Agendar servicio
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
