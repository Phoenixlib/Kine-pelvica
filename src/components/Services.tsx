"use client";

import { useState, useEffect } from "react";
import BookingFlow from "./booking/BookingFlow";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [mobileOpenCategory, setMobileOpenCategory] = useState<number | null>(null);
  const [bookingModal, setBookingModal] = useState<{ open: boolean; calLink: string; price?: string | number }>({
    open: false,
    calLink: "",
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>("");

  useEffect(() => {
    if (bookingModal.open || selectedService) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [bookingModal.open, selectedService]);

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

        {/* Vista Desktop (Tabs + Grid) */}
        <div className="hidden md:block">
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
              <h4 className="font-subtitle text-lg font-bold text-teal mb-8 text-center uppercase tracking-widest">
                {currentCategory.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 fade-in duration-500" key={safeActiveIndex}>
                {currentCategory.services.map((service, sIndex) => (
                  <div 
                    key={sIndex} 
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedServiceCategory(currentCategory.name);
                    }}
                    className="bg-white border border-terracotta/20 rounded-2xl p-6 flex flex-col hover:border-terracotta/50 hover:shadow-md transition-all h-full relative group cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="font-subtitle text-[13px] font-bold text-[#0f3f3e] mb-1">{service.name}</h4>
                      <div className="font-body text-sm text-[#0f3f3e]/60 mb-2 flex justify-between items-center">
                        {service.duration && <span>{formatDuration(service.duration)}</span>}
                        <span className="font-bold text-terracotta text-base">{formatPrice(service.price)}</span>
                      </div>
                      {service.details && (
                        <p className="font-body text-xs text-[#0f3f3e]/70 leading-relaxed mb-4 line-clamp-3">
                          {service.details}
                        </p>
                      )}
                      {!service.details && <div className="mb-4"></div>}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const calPath = service.bookingUrl?.replace("https://cal.com/", "") ?? "";
                        setBookingModal({ open: true, calLink: calPath, price: service.price });
                      }}
                      className="mt-auto block text-center bg-terracotta text-white w-full py-2.5 rounded-full font-subtitle text-[10px] uppercase tracking-widest font-bold hover:bg-teal transition-colors shadow-sm"
                    >
                      Agendar servicio
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vista Móvil (Accordion) */}
        <div className="block md:hidden space-y-4">
          {categories.map((category, index) => {
            const isOpen = mobileOpenCategory === index;
            return (
              <div 
                key={index} 
                className="bg-[#f7f3ef] border border-cream/50 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setMobileOpenCategory(isOpen ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left text-teal font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-cream/10 transition-colors"
                >
                  <span className="pr-4">{category.name}</span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-terracotta shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-teal/60 shrink-0" />
                  )}
                </button>

                {/* Accordion Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden border-t border-cream/30"
                    >
                      <div className="p-4 space-y-4">
                        {category.services.length === 0 ? (
                          <p className="text-center text-teal/40 font-body text-xs py-4">
                            No hay servicios registrados en esta categoría.
                          </p>
                        ) : (
                          category.services.map((service, sIndex) => (
                            <div 
                              key={sIndex} 
                              onClick={() => {
                                setSelectedService(service);
                                setSelectedServiceCategory(category.name);
                              }}
                              className="bg-white border border-terracotta/20 rounded-xl p-4 flex flex-col hover:border-terracotta/50 shadow-xs transition-all cursor-pointer"
                            >
                              <div className="flex-1">
                                <h4 className="font-subtitle text-[13px] font-bold text-[#0f3f3e] mb-1">{service.name}</h4>
                                <div className="font-body text-xs text-[#0f3f3e]/60 mb-2 flex justify-between items-center">
                                  {service.duration && <span>{formatDuration(service.duration)}</span>}
                                  <span className="font-bold text-terracotta text-sm">{formatPrice(service.price)}</span>
                                </div>
                                {service.details && (
                                  <p className="font-body text-xs text-[#0f3f3e]/70 leading-relaxed mb-3 line-clamp-3 font-light">
                                    {service.details}
                                  </p>
                                )}
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const calPath = service.bookingUrl?.replace("https://cal.com/", "") ?? "";
                                  setBookingModal({ open: true, calLink: calPath, price: service.price });
                                }}
                                className="mt-2 block text-center bg-terracotta text-white w-full py-2 rounded-full font-subtitle text-[9px] uppercase tracking-widest font-bold hover:bg-teal transition-colors shadow-sm"
                              >
                                Agendar servicio
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal overlay */}
      {bookingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden sm:[&::-webkit-scrollbar]:block [-ms-overflow-style:none] sm:[-ms-overflow-style:auto] [scrollbar-width:none] sm:[scrollbar-width:auto]">
            <button
              onClick={() => setBookingModal({ open: false, calLink: "" })}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow hover:bg-offwhite transition"
            >
              <X size={16} className="text-charcoal" />
            </button>
            <BookingFlow 
              calLink={bookingModal.calLink} 
              price={bookingModal.price}
              onClose={() => setBookingModal({ open: false, calLink: "" })} 
            />
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#f7f3ef] border border-cream/50 rounded-3xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-offwhite transition"
              aria-label="Cerrar modal"
            >
              <X size={16} className="text-charcoal" />
            </button>
            
            <div className="mt-2">
              <span className="text-[10px] font-subtitle font-bold tracking-[0.2em] text-terracotta uppercase">
                {selectedServiceCategory || "Servicio"}
              </span>
              <h3 className="font-title text-3xl text-teal mt-1 mb-4 leading-tight">
                {selectedService.name}
              </h3>
              
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                {selectedService.duration && (
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-cream/30 text-teal/80 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-terracotta">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {formatDuration(selectedService.duration)}
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-cream/30 text-teal font-bold">
                  <span className="text-terracotta">$</span>
                  {formatPrice(selectedService.price).replace("$", "")}
                </div>
              </div>

              {selectedService.details ? (
                <div className="bg-white rounded-2xl p-5 border border-cream/20 mb-6 max-h-[300px] overflow-y-auto">
                  <p className="font-body text-sm text-[#0f3f3e]/80 leading-relaxed whitespace-pre-line">
                    {selectedService.details}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 border border-cream/20 mb-6 italic text-sm text-teal/40">
                  Sin descripción disponible.
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {selectedService.bookingUrl ? (
                  <button
                    onClick={() => {
                      const calPath = selectedService.bookingUrl?.replace("https://cal.com/", "") ?? "";
                      setBookingModal({ open: true, calLink: calPath, price: selectedService.price });
                      setSelectedService(null);
                    }}
                    className="flex-1 bg-terracotta text-white py-3 px-6 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-teal transition-colors shadow-sm text-center cursor-pointer"
                  >
                    Agendar servicio
                  </button>
                ) : (
                  <a
                    href="https://wa.me/56950840767"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-teal text-white py-3 px-6 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold hover:bg-terracotta transition-colors shadow-sm text-center cursor-pointer"
                  >
                    Consultar por WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setSelectedService(null)}
                  className="sm:flex-none border border-cream text-teal bg-white hover:bg-cream/10 py-3 px-6 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
