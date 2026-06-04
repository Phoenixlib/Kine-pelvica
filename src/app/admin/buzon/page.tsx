"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { 
  Check, 
  Trash2, 
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Globe,
  X
} from "lucide-react";

interface CommunityMessage {
  id: string;
  name: string;
  email: string | null;
  type: "EXPERIENCE" | "QUESTION";
  message: string;
  status: "PENDING" | "READ" | "PUBLISHED_IN_BLOG";
  createdAt: Date | string;
}

export default function BuzonComunidadPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "READ" | "PUBLISHED_IN_BLOG">("PENDING");
  const [selectedMessage, setSelectedMessage] = useState<CommunityMessage | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: messages, isLoading } = api.communityMessage.getAllAdmin.useQuery();

  const updateStatus = api.communityMessage.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.communityMessage.getAllAdmin.invalidate();
      if (selectedMessage) {
        setSelectedMessage(null);
      }
    }
  });

  const deleteMessage = api.communityMessage.delete.useMutation({
    onSuccess: async () => {
      await utils.communityMessage.getAllAdmin.invalidate();
      setDeleteConfirmationId(null);
      if (selectedMessage) {
        setSelectedMessage(null);
      }
    }
  });

  const handleUpdateStatus = (id: string, status: "PENDING" | "READ" | "PUBLISHED_IN_BLOG", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateStatus.mutate({ id, status });
  };

  const handleDeleteTrigger = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmationId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmationId) {
      deleteMessage.mutate({ id: deleteConfirmationId });
    }
  };

  // Filter messages based on the active tab
  const filteredMessages = (messages as unknown as CommunityMessage[])?.filter((m) => {
    if (activeTab === "ALL") return true;
    return m.status === activeTab;
  }) || [];

  return (
    <div className="space-y-6 relative">
      {/* Top Header */}
      <div>
        <h1 className="font-title text-3xl text-teal">Buzón de la Comunidad</h1>
        <p className="font-body text-sm text-teal/70 mt-1">
          Revisa las historias y consultas que las usuarias envían para inspirar tu blog o contenido.
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
          Nuevos ({messages?.filter(m => m.status === "PENDING").length || 0})
        </button>
        <button
          onClick={() => setActiveTab("READ")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "READ"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Leídos ({messages?.filter(m => m.status === "READ").length || 0})
        </button>
        <button
          onClick={() => setActiveTab("PUBLISHED_IN_BLOG")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "PUBLISHED_IN_BLOG"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Usados en Blog ({messages?.filter(m => m.status === "PUBLISHED_IN_BLOG").length || 0})
        </button>
        <button
          onClick={() => setActiveTab("ALL")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === "ALL"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Todos ({messages?.length || 0})
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
          <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
          Cargando mensajes...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium">
          No hay mensajes en esta sección.
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body text-teal">
                <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
                  <tr>
                    <th className="px-6 py-4">Remitente</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4 max-w-sm">Mensaje</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream/10">
                  {filteredMessages.map((msg) => (
                    <tr 
                      key={msg.id} 
                      className="hover:bg-offwhite/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <td className="px-6 py-4 font-subtitle font-bold text-teal">
                        {msg.name}
                        {msg.email && (
                          <span className="block text-[10px] text-teal/50 font-body font-normal mt-0.5">
                            {msg.email}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          msg.type === "EXPERIENCE" ? "bg-teal/10 text-teal" : "bg-terracotta/10 text-terracotta"
                        }`}>
                          {msg.type === "EXPERIENCE" ? "Historia" : "Consulta"}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="font-body text-teal/80 leading-relaxed italic line-clamp-2">
                          "{msg.message}"
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal/80">
                        {new Date(msg.createdAt).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-subtitle font-bold uppercase tracking-wider ${
                          msg.status === "READ"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : msg.status === "PENDING"
                            ? "bg-redbrown/10 text-redbrown border border-redbrown/20"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {msg.status === "READ" ? "Leído" : msg.status === "PENDING" ? "Nuevo" : "En Blog"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {msg.status === "PENDING" && (
                            <button
                              onClick={(e) => handleUpdateStatus(msg.id, "READ", e)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition border border-cream/20"
                              title="Marcar como Leído"
                            >
                              <Check size={15} />
                            </button>
                          )}
                          {msg.status !== "PUBLISHED_IN_BLOG" && (
                            <button
                              onClick={(e) => handleUpdateStatus(msg.id, "PUBLISHED_IN_BLOG", e)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition border border-cream/20"
                              title="Marcar como Usado en Blog"
                            >
                              <Globe size={15} />
                            </button>
                          )}
                          {msg.status !== "PENDING" && (
                            <button
                              onClick={(e) => handleUpdateStatus(msg.id, "PENDING", e)}
                              className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition border border-cream/20"
                              title="Volver a Nuevo"
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteTrigger(msg.id, e)}
                            className="p-2 text-redbrown hover:bg-redbrown/5 rounded-xl transition"
                            title="Eliminar Mensaje"
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
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="bg-white p-5 rounded-3xl border border-cream/30 shadow-xs space-y-4 cursor-pointer hover:border-terracotta/30 transition-colors"
                onClick={() => setSelectedMessage(msg)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-subtitle font-bold text-teal text-sm">{msg.name}</h3>
                    {msg.email && <span className="text-[10px] text-teal/50 font-body block">{msg.email}</span>}
                    <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      msg.type === "EXPERIENCE" ? "bg-teal/10 text-teal" : "bg-terracotta/10 text-terracotta"
                    }`}>
                      {msg.type === "EXPERIENCE" ? "Historia" : "Consulta"}
                    </span>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-subtitle font-bold uppercase tracking-wider ${
                    msg.status === "READ"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : msg.status === "PENDING"
                      ? "bg-redbrown/10 text-redbrown border border-redbrown/20"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {msg.status === "READ" ? "Leído" : msg.status === "PENDING" ? "Nuevo" : "En Blog"}
                  </span>
                </div>

                <div className="relative pl-4 border-l-2 border-cream font-body text-xs text-teal/80 italic leading-relaxed line-clamp-3">
                  "{msg.message}"
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-cream/10 text-[10px] font-semibold text-teal/50">
                  <span>
                    {new Date(msg.createdAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex gap-1.5">
                    {msg.status === "PENDING" && (
                      <button
                        onClick={(e) => handleUpdateStatus(msg.id, "READ", e)}
                        className="p-2 text-amber-600 bg-amber-50/50 hover:bg-amber-50 rounded-xl transition border border-amber-100"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    {msg.status !== "PUBLISHED_IN_BLOG" && (
                      <button
                        onClick={(e) => handleUpdateStatus(msg.id, "PUBLISHED_IN_BLOG", e)}
                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200"
                      >
                        <Globe size={13} />
                      </button>
                    )}
                    {msg.status !== "PENDING" && (
                      <button
                        onClick={(e) => handleUpdateStatus(msg.id, "PENDING", e)}
                        className="p-2 text-teal/60 bg-offwhite hover:bg-cream/20 rounded-xl transition border border-cream/50"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteTrigger(msg.id, e)}
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

      {/* Modal for viewing the full message */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal/50 backdrop-blur-sm">
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 text-teal/40 hover:text-teal bg-offwhite hover:bg-cream/30 p-2 rounded-full transition"
            >
              <X size={20} />
            </button>
            
            <div className="flex justify-between items-start pr-12 mb-6">
              <div>
                <h3 className="font-subtitle font-bold text-teal text-xl md:text-2xl">{selectedMessage.name}</h3>
                {selectedMessage.email ? (
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm text-teal/50 font-body hover:text-terracotta transition block mt-1">
                    {selectedMessage.email}
                  </a>
                ) : (
                  <span className="text-sm text-teal/40 font-body block mt-1 italic">Sin correo electrónico</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  selectedMessage.type === "EXPERIENCE" ? "bg-teal/10 text-teal" : "bg-terracotta/10 text-terracotta"
                }`}>
                  {selectedMessage.type === "EXPERIENCE" ? "Historia / Experiencia" : "Consulta / Duda"}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider ${
                  selectedMessage.status === "READ"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : selectedMessage.status === "PENDING"
                    ? "bg-redbrown/10 text-redbrown border border-redbrown/20"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {selectedMessage.status === "READ" ? "Leído" : selectedMessage.status === "PENDING" ? "Nuevo" : "Usado en Blog"}
                </span>
              </div>
            </div>
            
            <div className="bg-offwhite p-5 md:p-6 rounded-2xl font-body text-sm text-teal/90 leading-relaxed overflow-y-auto mb-6 border border-cream/40">
              {selectedMessage.message.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-cream/30 gap-4">
              <span className="text-xs font-semibold text-teal/50 font-body uppercase tracking-wider">
                Recibido el {new Date(selectedMessage.createdAt).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
              
              <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
                {selectedMessage.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, "READ")}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200"
                  >
                    <Check size={14} /> Marcar Leído
                  </button>
                )}
                {selectedMessage.status !== "PUBLISHED_IN_BLOG" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, "PUBLISHED_IN_BLOG")}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200"
                  >
                    <Globe size={14} /> Usar en Blog
                  </button>
                )}
                {selectedMessage.status !== "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, "PENDING")}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-teal/70 bg-offwhite hover:bg-cream/40 rounded-xl transition border border-cream/50"
                  >
                    <RefreshCw size={14} /> A Nuevos
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTrigger(selectedMessage.id)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-redbrown bg-redbrown/5 hover:bg-redbrown/10 rounded-xl transition border border-redbrown/10"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          </div>
          
          {/* Backdrop click handler */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setSelectedMessage(null)}
          />
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-teal/60 backdrop-blur-xs">
          <div 
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border border-cream/30 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-12 h-12 bg-redbrown/10 text-redbrown rounded-full flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <h3 className="font-subtitle font-bold text-teal text-lg">¿Eliminar mensaje?</h3>
            <p className="font-body text-xs text-teal/70 leading-relaxed">
              Esta acción es permanente y no se podrá recuperar el mensaje. ¿Estás segura de que deseas continuar?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-teal/70 bg-offwhite hover:bg-cream/40 rounded-xl transition border border-cream/50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-redbrown hover:bg-redbrown/90 rounded-xl transition shadow-md"
              >
                Eliminar
              </button>
            </div>
          </div>
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setDeleteConfirmationId(null)}
          />
        </div>
      )}
    </div>
  );
}

