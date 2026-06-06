"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { X, Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDateStr: string | null;
  onSuccess: () => void;
}

const GENERATED_TIMES = Array.from({ length: 37 }, (_, i) => {
  const hour = Math.floor(i / 3) + 8; // Start at 08:00
  const minute = (i % 3) * 20;
  if (hour > 20 || (hour === 20 && minute > 0)) return null;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}).filter(Boolean) as string[];

export default function BloqueoHorasModal({
  isOpen,
  onClose,
  initialDateStr,
  onSuccess,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>("08:00"); // HH:MM
  const [endTime, setEndTime] = useState<string>("09:00"); // HH:MM
  const [isFullDay, setIsFullDay] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const createMutation = api.blockedSlot.create.useMutation();

  // Fullscreen support: switch from fixed to absolute to avoid hidden portal/top-layer issue
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  // Pre-fill date and time when initialDateStr changes or modal opens
  useEffect(() => {
    if (initialDateStr && isOpen) {
      const datePart = initialDateStr.substring(0, 10);
      setSelectedDate(datePart);

      if (initialDateStr.includes("T")) {
        const timePart = initialDateStr.substring(11, 16);
        // Find closest 20-min interval
        const [hrStr, minStr] = timePart.split(":");
        if (hrStr && minStr) {
          const hr = parseInt(hrStr);
          const min = parseInt(minStr);
          const roundedMin = Math.round(min / 20) * 20;
          let finalHr = hr;
          let finalMin = roundedMin;
          if (roundedMin === 60) {
            finalHr += 1;
            finalMin = 0;
          }
          const formatted = `${finalHr.toString().padStart(2, "0")}:${finalMin.toString().padStart(2, "0")}`;
          if (GENERATED_TIMES.includes(formatted)) {
            setSelectedTime(formatted);
            // Default endTime to 1 hour later if possible
            const endHr = finalHr + 1;
            const endFormatted = `${endHr.toString().padStart(2, "0")}:${finalMin.toString().padStart(2, "0")}`;
            if (GENERATED_TIMES.includes(endFormatted)) {
              setEndTime(endFormatted);
            } else {
              setEndTime(GENERATED_TIMES[GENERATED_TIMES.length - 1]!);
            }
          }
        }
      }
      setIsFullDay(false);
    } else if (isOpen) {
      const todayStr = new Date().toISOString().substring(0, 10);
      setSelectedDate(todayStr);
      setSelectedTime("08:00");
      setEndTime("09:00");
      setIsFullDay(false);
      setReason("");
      setErrorMsg(null);
      setWarningMsg(null);
    }
  }, [initialDateStr, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setWarningMsg(null);

    if (!selectedDate) {
      setErrorMsg("Por favor, selecciona una fecha.");
      return;
    }

    let startAt: Date;
    let endAt: Date;

    if (isFullDay) {
      startAt = new Date(`${selectedDate}T00:00:00`);
      endAt = new Date(`${selectedDate}T23:59:59`);
    } else {
      if (!selectedTime || !endTime) {
        setErrorMsg("Por favor, selecciona una hora de inicio y término.");
        return;
      }
      startAt = new Date(`${selectedDate}T${selectedTime}:00`);
      endAt = new Date(`${selectedDate}T${endTime}:00`);

      if (endAt <= startAt) {
        setErrorMsg("La hora de término debe ser posterior a la hora de inicio.");
        return;
      }
    }

    try {
      const result = await createMutation.mutateAsync({
        startAt,
        endAt,
        reason: reason.trim() || undefined,
      });

      if (result.warning) {
        setWarningMsg(result.warning);
        // We still succeeded locally, let user know
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al crear el bloqueo.");
    }
  };

  return (
    <div className={`${isFullscreen ? "absolute" : "fixed"} inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-sm animate-in fade-in duration-300`}>
      <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-cream/30 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-title text-teal font-bold leading-none">
              Bloquear Horario
            </h3>
            <p className="text-xs text-teal/60 font-medium mt-1">
              Sincronizado automáticamente con Cal.com
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cream/20 rounded-full text-teal/50 hover:text-teal transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 font-body">
          <form id="bloqueo-horas-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                Fecha del bloqueo *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream rounded-xl text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                />
                <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/40" />
              </div>
            </div>

            {/* Tipo de Bloqueo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                Tipo de Bloqueo
              </label>
              <div className="flex gap-4 p-3 rounded-xl border border-cream/50 bg-cream/5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      name="blockType" 
                      checked={!isFullDay}
                      onChange={() => setIsFullDay(false)}
                      className="peer appearance-none w-5 h-5 rounded-full border-2 border-teal/30 checked:border-terracotta transition-colors cursor-pointer"
                    />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-terracotta opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  <span className="text-sm font-bold text-teal group-hover:text-terracotta transition-colors">Por Horas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      name="blockType" 
                      checked={isFullDay}
                      onChange={() => setIsFullDay(true)}
                      className="peer appearance-none w-5 h-5 rounded-full border-2 border-teal/30 checked:border-terracotta transition-colors cursor-pointer"
                    />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-terracotta opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  <span className="text-sm font-bold text-teal group-hover:text-terracotta transition-colors">Día Completo</span>
                </label>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${isFullDay ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* Hora Inicio */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                  Hora Inicio *
                </label>
                <div className="relative">
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={isFullDay}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream rounded-xl text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors appearance-none cursor-pointer disabled:bg-gray-50"
                  >
                    {GENERATED_TIMES.map((time) => (
                      <option key={time} value={time}>
                        {time} hrs
                      </option>
                    ))}
                  </select>
                  <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/40" />
                </div>
              </div>

              {/* Hora Término */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                  Hora Final *
                </label>
                <div className="relative">
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isFullDay}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream rounded-xl text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors appearance-none cursor-pointer disabled:bg-gray-50"
                  >
                    {GENERATED_TIMES.map((time) => (
                      <option key={time} value={time}>
                        {time} hrs
                      </option>
                    ))}
                  </select>
                  <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/40" />
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                Motivo del bloqueo
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Ej. Almuerzo, Reunión, Vacaciones..."
                className="w-full px-4 py-2.5 bg-white border border-cream rounded-xl text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors resize-none"
              />
            </div>

            {errorMsg && (
              <p className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 font-bold">
                {errorMsg}
              </p>
            )}

            {warningMsg && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 font-medium flex gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>{warningMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cream/30 bg-white flex gap-3 flex-shrink-0 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="bloqueo-horas-form"
            disabled={createMutation.isPending}
            className="px-8 py-2.5 bg-terracotta hover:bg-[#b05b4a] text-white rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending ? "Bloqueando..." : "Confirmar Bloqueo"}
          </button>
        </div>
      </div>
    </div>
  );
}
