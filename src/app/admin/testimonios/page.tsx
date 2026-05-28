"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { 
  Check, 
  Archive, 
  Trash2, 
  AlertCircle,
  MessageSquare,
  RefreshCw
} from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  email: string | null;
  message: string;
  status: "PENDING" | "READ" | "ARCHIVED";
  createdAt: Date | string;
}

export default function TestimoniosPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "READ" | "ARCHIVED">("PENDING");

  const utils = api.useUtils();
  const { data: testimonials, isLoading } = api.testimonial.getAllAdmin.useQuery();

  const updateStatus = api.testimonial.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.testimonial.getAllAdmin.invalidate();
    }
  });

  const deleteTestimonial = api.testimonial.delete.useMutation({
    onSuccess: async () => {
      await utils.testimonial.getAllAdmin.invalidate();
    }
  });

  const handleUpdateStatus = (id: string, status: "PENDING" | "READ" | "ARCHIVED") => {
    updateStatus.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás segura de que deseas eliminar este testimonio de forma permanente?")) {
      deleteTestimonial.mutate({ id });
    }
  };

  // Filter testimonials based on the active tab
  const filteredTestimonials = (testimonials as unknown as Testimonial[])?.filter((t) => {
    if (activeTab === "ALL") return true;
    return t.status === activeTab;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="font-title text-3xl text-teal">Moderación de Testimonios</h1>
        <p className="font-body text-sm text-teal/70 mt-1">
          Gestiona y publica las reseñas que los pacientes envían desde tu página web.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-cream/30 gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "PENDING"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Pendientes ({testimonials?.filter(t => t.status === "PENDING").length || 0})
        </button>
        <button
          onClick={() => setActiveTab("READ")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "READ"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Publicados ({testimonials?.filter(t => t.status === "READ").length || 0})
        </button>
        <button
          onClick={() => setActiveTab("ARCHIVED")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "ARCHIVED"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Archivados ({testimonials?.filter(t => t.status === "ARCHIVED").length || 0})
        </button>
        <button
          onClick={() => setActiveTab("ALL")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "ALL"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Todos ({testimonials?.length || 0})
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
          <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
          Cargando testimonios...
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium">
          No hay testimonios en esta sección.
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body text-teal">
                <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
                  <tr>
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">Testimonio</th>
                    <th className="px-6 py-4">Fecha de Envío</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones Moderación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream/10">
                  {filteredTestimonials.map((testimonial) => (
                    <tr key={testimonial.id} className="hover:bg-offwhite/30 transition-colors">
                      <td className="px-6 py-4 font-subtitle font-bold text-teal">
                        {testimonial.name}
                        {testimonial.email && (
                          <span className="block text-[10px] text-teal/50 font-body font-normal mt-0.5">
                            {testimonial.email}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-md font-body text-teal/80 leading-relaxed italic">
                        "{testimonial.message}"
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal/80">
                        {new Date(testimonial.createdAt).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-subtitle font-bold uppercase tracking-wider ${
                          testimonial.status === "READ"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : testimonial.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                        }`}>
                          {testimonial.status === "READ" ? "Publicado" : testimonial.status === "PENDING" ? "Pendiente" : "Archivado"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {testimonial.status !== "READ" && (
                            <button
                              onClick={() => handleUpdateStatus(testimonial.id, "READ")}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition border border-cream/20"
                              title="Publicar en el Sitio Web"
                            >
                              <Check size={15} />
                            </button>
                          )}
                          {testimonial.status !== "ARCHIVED" && (
                            <button
                              onClick={() => handleUpdateStatus(testimonial.id, "ARCHIVED")}
                              className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition border border-cream/20"
                              title="Archivar Testimonio"
                            >
                              <Archive size={15} />
                            </button>
                          )}
                          {testimonial.status !== "PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(testimonial.id, "PENDING")}
                              className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition border border-cream/20"
                              title="Volver a Pendiente"
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(testimonial.id)}
                            className="p-2 text-redbrown hover:bg-redbrown/5 rounded-xl transition"
                            title="Eliminar Reseña"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {filteredTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-5 rounded-3xl border border-cream/30 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-subtitle font-bold text-teal text-sm">{testimonial.name}</h3>
                    {testimonial.email && <span className="text-[10px] text-teal/50 font-body block">{testimonial.email}</span>}
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-subtitle font-bold uppercase tracking-wider ${
                    testimonial.status === "READ"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : testimonial.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                  }`}>
                    {testimonial.status === "READ" ? "Publicado" : testimonial.status === "PENDING" ? "Pendiente" : "Archivado"}
                  </span>
                </div>

                <div className="relative pl-4 border-l-2 border-cream font-body text-xs text-teal/80 italic leading-relaxed">
                  "{testimonial.message}"
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-cream/10 text-[10px] font-semibold text-teal/50">
                  <span>
                    {new Date(testimonial.createdAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex gap-1.5">
                    {testimonial.status !== "READ" && (
                      <button
                        onClick={() => handleUpdateStatus(testimonial.id, "READ")}
                        className="p-2 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition border border-emerald-100"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    {testimonial.status !== "ARCHIVED" && (
                      <button
                        onClick={() => handleUpdateStatus(testimonial.id, "ARCHIVED")}
                        className="p-2 text-teal/60 bg-offwhite hover:bg-cream/20 rounded-xl transition border border-cream/50"
                      >
                        <Archive size={13} />
                      </button>
                    )}
                    {testimonial.status !== "PENDING" && (
                      <button
                        onClick={() => handleUpdateStatus(testimonial.id, "PENDING")}
                        className="p-2 text-teal/60 bg-offwhite hover:bg-cream/20 rounded-xl transition border border-cream/50"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="p-2 text-redbrown bg-redbrown/5 hover:bg-redbrown/10 rounded-xl transition border border-redbrown/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
