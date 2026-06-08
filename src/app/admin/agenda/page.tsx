"use client";

import { useState, useMemo, useEffect } from "react";
import { api } from "~/trpc/react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  parseISO,
  isBefore,
  startOfDay,
  setHours,
  setMinutes,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, RefreshCw, Maximize2, MoreVertical, X, Calendar } from "lucide-react";
import { STATUS_STYLES, AppointmentDetailModal } from "~/components/admin/AppointmentDetailModal";
import NuevaCitaKineModal from "~/components/admin/NuevaCitaKineModal";
import BloqueoHorasModal from "~/components/admin/BloqueoHorasModal";
import type { Appointment } from "~/components/admin/AppointmentDetailModal";
import { env } from "~/env";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Modals state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showNewCitaModal, setShowNewCitaModal] = useState(false);
  const [initialNewCitaDate, setInitialNewCitaDate] = useState<string | null>(null);

  // Bloqueo Horas state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [initialBlockDate, setInitialBlockDate] = useState<string | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, dateStr: string } | null>(null);

  const utils = api.useUtils();

  // Queries
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const { data: appointmentsData, isLoading, refetch, isRefetching } = api.appointment.getAll.useQuery({
    startDate,
    endDate,
    limit: 100,
  });
  
  const appointments = appointmentsData?.appointments || [];

  const { data: blockedSlots = [] } = api.blockedSlot.getAll.useQuery({
    startDate,
    endDate,
  });

  // Mutations
  const updateMutation = api.appointment.update.useMutation({
    onSuccess: () => utils.appointment.getAll.invalidate(),
  });

  const deleteMutation = api.appointment.delete.useMutation({
    onSuccess: () => {
      setSelectedAppt(null);
      utils.appointment.getAll.invalidate();
    },
  });

  const createBlockMutation = api.blockedSlot.create.useMutation({
    onSuccess: () => utils.blockedSlot.getAll.invalidate(),
  });

  const deleteBlockMutation = api.blockedSlot.delete.useMutation({
    onSuccess: () => utils.blockedSlot.getAll.invalidate(),
  });

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Handlers
  const handlePrevWeek = () => setCurrentDate((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentDate((prev) => addWeeks(prev, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setPickerDate(now);
  };

  const handleCellClick = (e: React.MouseEvent, date: Date, hour: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir que el event listener del window lo cierre instantáneamente
    const cellDate = setHours(setMinutes(startOfDay(date), 0), hour);
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      dateStr: format(cellDate, "yyyy-MM-dd'T'HH:mm:ss"),
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Close context menu on outside click or scroll
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleClick);
    };
  }, []);

  const handleActionCreateCita = () => {
    if (contextMenu) {
      setInitialNewCitaDate(contextMenu.dateStr);
      setShowNewCitaModal(true);
    }
    closeContextMenu();
  };

  const handleActionBlockSlot = () => {
    if (contextMenu) {
      setInitialBlockDate(contextMenu.dateStr);
      setShowBlockModal(true);
    }
    closeContextMenu();
  };

  const handleDeleteBlock = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    setBlockToDelete(blockId);
  };

  const confirmDeleteBlock = () => {
    if (blockToDelete) {
      deleteBlockMutation.mutate({ id: blockToDelete });
      setBlockToDelete(null);
    }
  };

  const weekDays = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const toggleFullscreen = () => {
    const container = document.getElementById("agenda-container");
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Close date picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      window.addEventListener("click", handleClick);
    }
    return () => window.removeEventListener("click", handleClick);
  }, [showDatePicker]);

  // Mini Calendar Render Helper
  const renderMiniCalendar = () => {
    const monthStart = startOfDay(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1));
    const monthEnd = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0);
    const startDateCal = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDateCal = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDateCal, end: endDateCal });

    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    return (
      <div className="bg-white rounded-2xl border border-cream/50 shadow-xl p-4 w-[300px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-1">
            <button type="button" onClick={(e) => { e.stopPropagation(); setPickerDate(subMonths(pickerDate, 12)); }} className="p-1 hover:bg-cream/20 rounded-md text-teal" title="Año anterior"><ChevronsLeft size={16}/></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setPickerDate(subMonths(pickerDate, 1)); }} className="p-1 hover:bg-cream/20 rounded-md text-teal" title="Mes anterior"><ChevronLeft size={16}/></button>
          </div>
          
          <div className="flex items-center gap-1.5">
             <span className="text-xs font-bold uppercase text-teal tracking-wider">
               {format(pickerDate, "MMMM", { locale: es })}
             </span>
             <div className="relative">
               <select
                  value={pickerDate.getFullYear()} 
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const newYear = parseInt(e.target.value);
                    const newDate = new Date(pickerDate);
                    newDate.setFullYear(newYear);
                    setPickerDate(newDate);
                  }}
                  className="text-xs font-bold uppercase text-teal bg-cream/20 hover:bg-cream/40 px-2 py-1 rounded-md outline-none cursor-pointer transition-colors appearance-none pr-5"
               >
                  {yearsList.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
               </select>
               <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-teal/50">
                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
               </div>
             </div>
          </div>

          <div className="flex gap-1">
            <button type="button" onClick={(e) => { e.stopPropagation(); setPickerDate(addMonths(pickerDate, 1)); }} className="p-1 hover:bg-cream/20 rounded-md text-teal" title="Mes siguiente"><ChevronRight size={16}/></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setPickerDate(addMonths(pickerDate, 12)); }} className="p-1 hover:bg-cream/20 rounded-md text-teal" title="Año siguiente"><ChevronsRight size={16}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-teal/50 font-bold mb-2">
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === pickerDate.getMonth();
            const isSelected = isSameDay(day, currentDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentDate(day);
                  setShowDatePicker(false);
                }}
                className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  !isCurrentMonth ? "text-teal/20" :
                  isSelected ? "bg-teal text-white shadow-md" :
                  isToday ? "bg-cream/30 text-teal font-bold" :
                  "text-teal hover:bg-cream/20"
                }`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full gap-6 p-2 lg:p-6 bg-offwhite/50">
      {/* Main Agenda Area */}
      <div 
        id="agenda-container"
        className={`flex-1 flex flex-col bg-white border border-cream/50 overflow-hidden transition-all ${
          isFullscreen 
            ? "fixed inset-0 z-50 w-screen h-screen p-6 bg-white" 
            : "rounded-3xl shadow-sm h-[calc(100vh-80px)] lg:h-auto"
        }`}
      >
        {/* Agenda Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-cream/50 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-cream/30 rounded-full text-teal transition-colors"><ChevronLeft size={20} /></button>
            
            {/* Popover Date Picker Trigger */}
            <div className="relative date-picker-container">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowDatePicker(!showDatePicker); setPickerDate(currentDate); }}
                className="text-base sm:text-lg font-title text-teal capitalize min-w-48 text-center font-bold hover:bg-cream/20 px-4 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {format(startDate, "MMMM yyyy", { locale: es })}
                <span className="text-xs opacity-50">▼</span>
              </button>

              {/* Popover */}
              {showDatePicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                   {renderMiniCalendar()}
                </div>
              )}
            </div>

            <button onClick={handleNextWeek} className="p-2 hover:bg-cream/30 rounded-full text-teal transition-colors"><ChevronRight size={20} /></button>
            <button onClick={handleToday} className="px-4 py-1.5 bg-cream/20 hover:bg-cream/40 text-teal text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ml-2 hidden sm:block">
              Hoy
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={() => refetch()} className="p-2 hover:bg-cream/30 rounded-xl text-teal/70 transition-colors" title="Actualizar">
              <RefreshCw size={18} className={isRefetching ? "animate-spin text-terracotta" : ""} />
            </button>
            <button 
              onClick={toggleFullscreen} 
              className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                isFullscreen 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "hover:bg-cream/30 text-teal/70"
              }`} 
              title={isFullscreen ? "Volver (Salir de pantalla completa)" : "Pantalla Completa"}
            >
              {isFullscreen ? (
                <>
                  <X size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Volver</span>
                </>
              ) : (
                <Maximize2 size={18} />
              )}
            </button>
            <a 
              href={env.NEXT_PUBLIC_CALCOM_ADMIN_URL ?? "https://cal.com/availability/1597637"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-teal hover:bg-teal/90 transition-colors text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-widest gap-2 shadow-sm"
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Disponibilidad</span>
            </a>
            <button
              onClick={() => {
                setInitialNewCitaDate(null);
                setShowNewCitaModal(true);
              }}
              className="flex items-center justify-center bg-terracotta hover:bg-[#b05b4a] transition-colors text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-widest gap-2 shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nueva Cita</span>
            </button>
          </div>
        </div>

        {/* Compact Grid View */}
        <div className="flex-1 overflow-auto relative">
          <div className="min-w-[800px] h-full flex flex-col">
            {/* Days Header */}
            <div className="flex border-b border-cream/50 sticky top-0 bg-white/95 backdrop-blur-sm z-30">
              <div className="w-16 shrink-0 border-r border-cream/30 bg-offwhite/30" />
              {weekDays.map((day, idx) => (
                <div key={idx} className={`flex-1 min-w-0 p-3 text-center border-r border-cream/30 ${isSameDay(day, new Date()) ? 'bg-cream/10' : ''}`}>
                  <p className="text-[10px] font-bold uppercase text-teal/60 tracking-wider">
                    {format(day, "EEEE", { locale: es })}
                  </p>
                  <p className={`text-xl font-title mt-0.5 ${isSameDay(day, new Date()) ? 'text-terracotta' : 'text-teal'}`}>
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="flex relative bg-offwhite/10" style={{ height: `${HOURS.length * 56}px` }}>
              {/* Time Labels (Y-axis) */}
              <div className="w-16 shrink-0 border-r border-cream/30 bg-white sticky left-0 z-20">
                {HOURS.map((hour) => (
                  <div key={hour} className="h-[56px] flex items-start justify-end pr-2 pt-1 border-b border-cream/30 box-border">
                    <span className="text-[10px] font-bold text-teal/40">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className="flex-1 flex relative">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 pointer-events-none z-0 flex flex-col">
                   {HOURS.map(h => (
                     <div key={h} className="h-[56px] border-b border-cream/30 box-border w-full" />
                   ))}
                </div>

                {/* Vertical columns for interaction */}
                {weekDays.map((day, dIdx) => (
                  <div key={dIdx} className="flex-1 relative border-r border-cream/30 box-border z-10">
                    {/* Empty cell interaction areas */}
                    {HOURS.map(hour => {
                      return (
                         <div 
                           key={hour} 
                           className={`absolute w-full h-[56px] cursor-pointer hover:bg-teal/5 transition-colors`}
                           style={{ top: `${(hour - 8) * 56}px` }}
                           onClick={(e) => handleCellClick(e, day, hour)}
                         />
                      );
                    })}

                    {/* Blocked Slots Overlay */}
                    {blockedSlots
                      .filter((bs) => isSameDay(new Date(bs.startAt), day))
                      .map((block) => {
                        const startObj = new Date(block.startAt);
                        const endObj = new Date(block.endAt);
                        
                        const startDecimal = startObj.getHours() + startObj.getMinutes() / 60;
                        const durationHrs = (endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60);

                        if (startDecimal < 8 || startDecimal > 20) return null;

                        const top = (startDecimal - 8) * 56;
                        const height = durationHrs * 56;

                        return (
                          <div
                            key={block.id}
                            className="absolute left-1 right-1 bg-slate-200/80 border border-slate-300 rounded-lg p-1 overflow-hidden z-20 flex items-center justify-between shadow-sm cursor-not-allowed"
                            style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-tight">
                              Bloqueado
                            </span>
                            <button
                              onClick={(e) => handleDeleteBlock(e, block.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                    })}

                    {/* Appointments Overlay */}
                    {appointments
                      .filter((appt) => isSameDay(new Date(appt.date), day))
                      .map((appt) => {
                        const startObj = new Date(appt.date);
                        const startDecimal = startObj.getHours() + startObj.getMinutes() / 60;
                        const durationHrs = appt.durationMinutes / 60;

                        if (startDecimal < 8 || startDecimal > 20) return null;

                        const top = (startDecimal - 8) * 56;
                        const height = durationHrs * 56;
                        const styleConfig = STATUS_STYLES[appt.status];

                        return (
                          <div
                            key={appt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppt(appt as any);
                            }}
                            className={`absolute left-1 right-1 rounded-xl p-2 cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 z-20 overflow-hidden flex flex-col ${styleConfig.bg} ${styleConfig.text} !border-l-current`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <p className={`text-[10px] font-bold truncate leading-tight`}>
                              {appt.patient.firstName} {appt.patient.lastName}
                            </p>
                            <p className={`text-[9px] truncate mt-0.5 opacity-80 ${styleConfig.text}`}>
                              {appt.service?.name || appt.title}
                            </p>
                            {height >= 50 && (
                               <p className={`text-[9px] font-semibold mt-auto truncate opacity-70 ${styleConfig.text}`}>
                                 {format(startObj, "HH:mm")} - {format(new Date(startObj.getTime() + appt.durationMinutes * 60000), "HH:mm")}
                               </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="fixed z-50 bg-white rounded-xl shadow-xl border border-cream/50 py-1 w-48 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-cream/30 mb-1">
              <span className="text-[10px] font-bold text-teal/50 uppercase tracking-widest block">
                {format(new Date(contextMenu.dateStr), "d MMM, HH:mm", { locale: es })}
              </span>
            </div>
            <button
              onClick={handleActionCreateCita}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-teal hover:bg-cream/10 transition-colors flex items-center gap-2"
            >
              <Plus size={14} className="text-terracotta" />
              Agendar Cita
            </button>
            <button
              onClick={handleActionBlockSlot}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-teal hover:bg-cream/10 transition-colors flex items-center gap-2"
            >
              <X size={14} className="text-red-500" />
              Bloquear Horario
            </button>
          </div>
        )}
        {/* Detail Modal */}
        {selectedAppt && (
          <AppointmentDetailModal
            appt={selectedAppt}
            onClose={() => setSelectedAppt(null)}
            onUpdate={(data) => updateMutation.mutate(data)}
            onDelete={(id) => deleteMutation.mutate({ id })}
            isUpdating={updateMutation.isPending}
          />
        )}

        {/* New Appointment Modal */}
        <NuevaCitaKineModal
          isOpen={showNewCitaModal}
          onClose={() => setShowNewCitaModal(false)}
          initialDateStr={initialNewCitaDate}
          onSuccess={() => refetch()}
        />

        {/* Bloqueo Horas Modal */}
        <BloqueoHorasModal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          initialDateStr={initialBlockDate}
          onSuccess={() => {
            utils.blockedSlot.getAll.invalidate();
          }}
        />

        {/* Custom Confirmation Modal for Deletion */}
        {blockToDelete && (
          <div className={`${isFullscreen ? "absolute" : "fixed"} inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-sm animate-in fade-in duration-300`}>
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center border-t-4 border-red-500 font-body">
              <h3 className="text-base font-bold text-teal mb-2">¿Eliminar bloqueo?</h3>
              <p className="text-xs text-teal/60 mb-6 font-medium">
                Esta acción eliminará el bloqueo tanto a nivel local como en Cal.com.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setBlockToDelete(null)}
                  className="px-4 py-2 bg-cream/20 hover:bg-cream/40 text-teal text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteBlock}
                  disabled={deleteBlockMutation.isPending}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                  {deleteBlockMutation.isPending ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
