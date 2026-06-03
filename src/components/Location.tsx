import { MapPin } from "lucide-react";

interface LocationProps {
  address?: string;
}

export function Location({ address }: LocationProps) {
  if (!address) return null;

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <section id="ubicacion" className="py-20 px-4 bg-offwhite relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-subtitle font-bold tracking-[0.2em] uppercase mb-3 text-terracotta">
            Dónde encontrarnos
          </span>
          <h2 className="text-4xl md:text-5xl font-title text-teal mb-4">
            Cómo llegar
          </h2>
          <p className="text-lg font-body text-teal/70">
            Ven a conocernos, te esperamos en nuestra consulta.
          </p>
        </div>

        {/* Contenedor del Mapa */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-cream/30">
          <div className="flex flex-col md:flex-row">
            {/* Info Panel */}
            <div className="p-8 md:p-12 md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-cream/50 bg-cream/10">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-cream/50">
                <MapPin className="w-7 h-7 text-terracotta" />
              </div>
              <h3 className="text-2xl font-title text-teal mb-2">
                Estudio Pélvico Camila Ortiz
              </h3>
              <p className="text-lg mb-6 leading-relaxed whitespace-pre-line font-body text-teal/70">
                {address}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-teal text-white px-6 py-3 rounded-full font-subtitle text-xs uppercase tracking-widest font-bold transition-transform hover:-translate-y-1 shadow-md w-full text-center hover:bg-teal/90"
              >
                Abrir en Google Maps
              </a>
            </div>

            {/* Iframe Mapa */}
            <div className="md:w-2/3 h-[400px] md:h-auto min-h-[400px] relative">
              <iframe
                src={mapUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ubicación"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
