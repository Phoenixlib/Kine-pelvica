"use client";

import { useEffect, useState } from "react";
import { X, Clock, Calendar as CalendarIcon, Info, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  block: {
    id: string;
    startAt: Date;
    endAt: Date;
    reason: string | null;
    isVirtual?: boolean;
  } | null;
  onDelete: (blockId: string) => void;
  isDeleting: boolean;
}

export default function BlockDetailsModal({
  isOpen,
  onClose,
  block,
  onDelete,
  isDeleting,
}: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  if (!isOpen || !block) return null;

  const startObj = new Date(block.startAt);
  const endObj = new Date(block.endAt);

  const isFullDay = 
    (startObj.getHours() === 0 && startObj.getMinutes() === 0 && endObj.getHours() === 23 && endObj.getMinutes() === 59) ||
    (startObj.getHours() === 8 && startObj.getMinutes() === 0 && endObj.getHours() === 20 && endObj.getMinutes() === 0 && block.isVirtual);

  const formattedDate = format(startObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedStart = format(startObj, "HH:mm");
  const formattedEnd = format(endObj, "HH:mm");
  
  const isVirtual = block.id.startsWith("virtual_") || block.isVirtual;

  return (
    <div className={`${isFullscreen ? "absolute" : "fixed"} inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-sm animate-in fade-in duration-300`}>
      <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-cream/30 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-title text-teal font-bold leading-none">
              Detalle del Bloqueo
            </h3>
            <p className="text-xs text-teal/60 font-medium mt-1">
              Información sobre el horario reservado
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cream/20 rounded-full text-teal/50 hover:text-teal transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 font-body space-y-4">
          {/* Fecha */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-cream/50 bg-white shadow-sm">
            <CalendarIcon className="text-terracotta shrink-0 mt-0.5" size={18} />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal/55 block">Fecha</span>
              <span className="text-sm font-semibold text-teal capitalize">{formattedDate}</span>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-cream/50 bg-white shadow-sm">
            <Clock className="text-terracotta shrink-0 mt-0.5" size={18} />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal/55 block">Horario</span>
              <span className="text-sm font-semibold text-teal">
                {isFullDay ? "Todo el día" : `${formattedStart} hrs - ${formattedEnd} hrs`}
              </span>
            </div>
          </div>

          {/* Origen */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-cream/50 bg-white shadow-sm">
            <Info className="text-terracotta shrink-0 mt-0.5" size={18} />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal/55 block">Origen</span>
              <span className="text-sm font-semibold text-teal flex items-center gap-1.5">
                {isVirtual ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Cal.com (Externo)
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    Aplicación (Local)
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Motivo (solo si no es virtual y tiene motivo) */}
          {(!isVirtual && block.reason) && (
            <div className="p-4 rounded-xl border border-cream/50 bg-cream/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal/55 block mb-1">Motivo del Bloqueo</span>
              <p className="text-sm text-teal font-medium italic">"{block.reason}"</p>
            </div>
          )}
          
          {isVirtual && (
            <p className="text-[11px] text-teal/65 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
              💡 Este bloqueo fue creado como una anulación de fecha en Cal.com. Al eliminarlo desde aquí, se habilitará de nuevo la disponibilidad en tu calendario de Cal.com.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cream/30 bg-white flex gap-3 flex-shrink-0 justify-between">
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase transition-all flex items-center gap-2 border border-red-200"
          >
            <Trash2 size={14} />
            {isDeleting ? "Eliminando..." : "Eliminar Bloqueo"}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all border border-cream"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
