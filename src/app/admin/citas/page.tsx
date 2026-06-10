"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { 
  Search, 
  Trash2, 
  X,
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Check,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import type { AppointmentStatus, PaymentMethod } from "../../../../generated/prisma";

import { 
  AppointmentDetailModal,
  NotesModal,
  CancelReasonModal,
  STATUS_LABELS,
  STATUS_STYLES,
  getPaymentLabel,
  type Appointment
} from "~/components/admin/AppointmentDetailModal";

export default function CitasPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");

  // Selection states for modals
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [notesAppt, setNotesAppt] = useState<Appointment | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");


  const utils = api.useUtils();

  // Reset page on search or filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, view]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: appointmentsData, isLoading: apptsLoading } = api.appointment.getAll.useQuery({
    page,
    limit: 15,
    status: statusFilter === "All" ? undefined : (statusFilter as AppointmentStatus),
    searchQuery: searchQuery || undefined,
    view,
  }, {
    placeholderData: (previousData) => previousData,
  });

  const appointmentsList = appointmentsData?.appointments as unknown as Appointment[] || [];
  const totalPages = appointmentsData?.totalPages || 1;
  const totalCount = appointmentsData?.total || 0;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkScroll);
    };
  }, [appointmentsList]);

  const updateMutation = api.appointment.update.useMutation({
    onSuccess: async () => {
      await utils.appointment.getAll.invalidate();
      await utils.stats.getDashboardStats.invalidate();
      
      // Reset transition states
      setCancellingAppt(null);
      setCancelReason("");
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const deleteMutation = api.appointment.delete.useMutation({
    onSuccess: async () => {
      await utils.appointment.getAll.invalidate();
      await utils.stats.getDashboardStats.invalidate();
      setSelectedAppt(null);
    }
  });

  const isTransitionPending = (apptId: string, targetStatus: AppointmentStatus) => {
    return updateMutation.isPending && 
      updateMutation.variables?.id === apptId && 
      updateMutation.variables?.status === targetStatus;
  };

  const isAnyTransitionPendingForAppt = (apptId: string) => {
    return updateMutation.isPending && updateMutation.variables?.id === apptId;
  };

  const handleStatusTransition = (appt: Appointment, newStatus: AppointmentStatus) => {
    if (newStatus === "CANCELLED") {
      setCancellingAppt(appt);
      setCancelReason("");
    } else {
      updateMutation.mutate({
        id: appt.id,
        status: newStatus,
        cancelReason: null,
      });
    }
  };

  const handleCancelConfirm = (reason: string) => {
    if (!cancellingAppt) return;
    updateMutation.mutate({
      id: cancellingAppt.id,
      status: "CANCELLED",
      cancelReason: reason || "Cancelada por el administrador",
    });
  };

  const handleModalUpdate = (data: {
    id: string;
    status?: AppointmentStatus;
    paymentMethod?: PaymentMethod | null;
    notes?: string | null;
    cancelReason?: string | null;
    date?: Date;
  }) => {
    updateMutation.mutate(data, {
      onSuccess: (updated) => {
        // Sync open modal data with the updated one using functional update to prevent reopening if closed
        setSelectedAppt((prev) => {
          if (prev && prev.id === updated.id) {
            return {
              ...prev,
              status: updated.status,
              paymentMethod: updated.paymentMethod,
              notes: updated.notes,
              cancelReason: updated.cancelReason,
            } as Appointment;
          }
          return null;
        });
      }
    });
  };

  const handleDeleteClick = (id: string) => {
    deleteMutation.mutate({ id });
  };

  // Find updated selectedAppt if it changed in the background
  const currentDetailAppt = selectedAppt 
    ? (appointmentsList.find(a => a.id === selectedAppt.id) || selectedAppt) 
    : null;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h1 className="font-title text-3xl text-teal">Directorio de Citas</h1>
        <p className="font-body text-sm text-teal/70 mt-1">
          Visualiza, cambia de estado, y administra los agendamientos de tus pacientes.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-cream/30 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal/30 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-offwhite border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors placeholder:text-teal/30"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar items-center">
            {[
              { value: "upcoming", label: "Próximas" },
              { value: "past", label: "Historial" },
              { value: "all", label: "Todas" },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => { setView(tab.value as "upcoming" | "past" | "all"); setPage(1); }}
                className={`px-4 py-2 rounded-full font-subtitle text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap shrink-0 ${
                  view === tab.value
                    ? "bg-teal text-white shadow-sm"
                    : "bg-white text-teal border border-cream hover:bg-offwhite"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-offwhite border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors shrink-0"
          >
            <option value="All">Todos los Estados</option>
            <option value="BOOKED">Reservadas</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="ATTENDED">Asistió</option>
            <option value="NO_SHOW">No Asistió</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden relative">
        {/* Left Fade Overlay */}
        <div 
          className={`absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-teal/10 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${canScrollLeft ? "opacity-100" : "opacity-0"}`} 
        />
        {/* Right Fade Overlay */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-teal/10 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${canScrollRight ? "opacity-100" : "opacity-0"}`} 
        />
        
        <div 
          ref={tableContainerRef}
          onScroll={checkScroll}
          className="overflow-x-auto"
        >
          <table className="w-full text-left text-xs font-body text-teal">
            <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap w-[120px] min-w-[120px]">Fecha y Hora</th>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Cita / Terapia</th>
                <th className="px-6 py-4">Medio de Pago</th>
                <th className="px-6 py-4">Precio Servicio</th>
                <th className="px-6 py-4 text-center">Notas</th>
                <th className="px-6 py-4">Estado Cita</th>
                <th className="pl-4 pr-6 py-4 text-left">Cambiar Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/10">
              {apptsLoading && appointmentsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-teal/40 font-medium">
                    <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando citas...
                  </td>
                </tr>
              ) : appointmentsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-teal/50 font-medium">
                    No se encontraron agendamientos.
                  </td>
                </tr>
              ) : (
                appointmentsList.map((appt) => {
                  const dateObj = new Date(appt.date);
                  const formattedDate = mounted ? dateObj.toLocaleDateString("es-CL") : "—";
                  const formattedTime = mounted 
                    ? dateObj.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) 
                    : "—";

                  const serviceName = appt.service ? appt.service.name : appt.title;
                  const servicePrice = appt.service ? `$${appt.service.price.toLocaleString("es-CL")}` : "—";
                  const statusStyle = STATUS_STYLES[appt.status] || { bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-200" };
                  const hasNotes = !!appt.notes && appt.notes.trim() !== "";

                  const isAnyPending = isAnyTransitionPendingForAppt(appt.id);
                  const isPendingConfirm = isTransitionPending(appt.id, "CONFIRMED");
                  const isPendingCancel = isTransitionPending(appt.id, "CANCELLED");
                  const isPendingAttended = isTransitionPending(appt.id, "ATTENDED");
                  const isPendingNoShow = isTransitionPending(appt.id, "NO_SHOW");
                  const isPendingBooked = isTransitionPending(appt.id, "BOOKED");

                  return (
                    <tr 
                      key={appt.id} 
                      onClick={() => setSelectedAppt(appt)}
                      className="hover:bg-offwhite/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-[120px] min-w-[120px]">
                        <span className="font-semibold block leading-tight">{formattedDate}</span>
                        <span className="text-[10px] text-teal/60 block mt-0.5 leading-none">{formattedTime} hrs</span>
                      </td>
                      <td className="px-6 py-4 font-subtitle font-bold text-teal">
                        {appt.patient.firstName} {appt.patient.lastName}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {serviceName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal/80">
                        {getPaymentLabel(appt.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal/80">
                        {servicePrice}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={!hasNotes}
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotesAppt(appt);
                          }}
                          className={`p-2 rounded-xl transition ${
                            hasNotes 
                              ? "text-amber-600 hover:text-amber-800 hover:bg-amber-50 cursor-pointer" 
                              : "text-teal/20 cursor-not-allowed"
                          }`}
                          title={hasNotes ? "Ver Notas" : "Sin notas"}
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                          {STATUS_LABELS[appt.status]}
                        </span>
                      </td>
                      <td className="pl-4 pr-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-start gap-1.5">
                          {appt.status === "BOOKED" && (
                            <>
                              <button
                                disabled={isAnyPending}
                                onClick={() => handleStatusTransition(appt, "CONFIRMED")}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                  isPendingConfirm
                                    ? "bg-blue-600 border-blue-700 text-white opacity-95 cursor-not-allowed"
                                    : "bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                }`}
                              >
                                {isPendingConfirm ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <Check size={11} />
                                )}
                                {isPendingConfirm ? "Confirmando..." : "Confirmar"}
                              </button>
                              <button
                                disabled={isAnyPending}
                                onClick={() => handleStatusTransition(appt, "CANCELLED")}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                  isPendingCancel
                                    ? "bg-red-600 border-red-700 text-white opacity-95 cursor-not-allowed"
                                    : "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                }`}
                              >
                                {isPendingCancel ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <X size={11} />
                                )}
                                {isPendingCancel ? "Cancelando..." : "Cancelar"}
                              </button>
                            </>
                          )}
                          {appt.status === "CONFIRMED" && (
                            <>
                              <button
                                disabled={isAnyPending}
                                onClick={() => handleStatusTransition(appt, "ATTENDED")}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                  isPendingAttended
                                    ? "bg-emerald-600 border-emerald-700 text-white opacity-95 cursor-not-allowed"
                                    : "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                }`}
                              >
                                {isPendingAttended ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={11} />
                                )}
                                {isPendingAttended ? "Guardando..." : "Asistió"}
                              </button>
                              <button
                                disabled={isAnyPending}
                                onClick={() => handleStatusTransition(appt, "NO_SHOW")}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                  isPendingNoShow
                                    ? "bg-orange-600 border-orange-700 text-white opacity-95 cursor-not-allowed"
                                    : "bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                }`}
                              >
                                {isPendingNoShow ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <AlertTriangle size={11} />
                                )}
                                {isPendingNoShow ? "Guardando..." : "No Asistió"}
                              </button>
                              <button
                                disabled={isAnyPending}
                                onClick={() => handleStatusTransition(appt, "CANCELLED")}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                  isPendingCancel
                                    ? "bg-red-600 border-red-700 text-white opacity-95 cursor-not-allowed"
                                    : "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                }`}
                              >
                                {isPendingCancel ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <X size={11} />
                                )}
                                {isPendingCancel ? "Cancelando..." : "Cancelar"}
                              </button>
                            </>
                          )}
                          {(appt.status === "ATTENDED" || appt.status === "NO_SHOW") && (
                            <button
                              disabled={isAnyPending}
                              onClick={() => handleStatusTransition(appt, "BOOKED")}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                isPendingBooked
                                  ? "bg-slate-600 border-slate-700 text-white opacity-95 cursor-not-allowed"
                                  : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                              }`}
                            >
                              {isPendingBooked ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <RotateCcw size={11} />
                              )}
                              {isPendingBooked ? "Restableciendo..." : "Reestablecer"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {apptsLoading && appointmentsList.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
            <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
            Cargando citas...
          </div>
        ) : appointmentsList.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium">
            No se encontraron agendamientos.
          </div>
        ) : (
          appointmentsList.map((appt) => {
            const dateObj = new Date(appt.date);
            const formattedDate = mounted ? dateObj.toLocaleDateString("es-CL", { weekday: 'short', day: 'numeric', month: 'short' }) : "—";
            const formattedTime = mounted ? dateObj.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "—";
            const serviceName = appt.service ? appt.service.name : appt.title;
            const servicePrice = appt.service ? `$${appt.service.price.toLocaleString("es-CL")}` : "—";
            const statusStyle = STATUS_STYLES[appt.status] || { bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-200" };
            const hasNotes = !!appt.notes && appt.notes.trim() !== "";

            const isAnyPending = isAnyTransitionPendingForAppt(appt.id);
            const isPendingConfirm = isTransitionPending(appt.id, "CONFIRMED");
            const isPendingCancel = isTransitionPending(appt.id, "CANCELLED");
            const isPendingAttended = isTransitionPending(appt.id, "ATTENDED");
            const isPendingNoShow = isTransitionPending(appt.id, "NO_SHOW");
            const isPendingBooked = isTransitionPending(appt.id, "BOOKED");

            return (
              <div 
                key={appt.id} 
                onClick={() => setSelectedAppt(appt)}
                className="bg-white p-5 rounded-3xl border border-cream/30 shadow-xs space-y-4 active:bg-offwhite/30 transition-colors cursor-pointer"
              >
                {/* Header (Date & Status) */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-subtitle font-bold text-teal text-sm leading-tight capitalize">{formattedDate}</h4>
                    <span className="text-[11px] text-teal/60 font-body">{formattedTime} hrs</span>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-subtitle font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                    {STATUS_LABELS[appt.status]}
                  </span>
                </div>

                {/* Details Box */}
                <div className="bg-offwhite/50 border border-cream/20 rounded-2xl p-4 space-y-2">
                  <div className="grid grid-cols-3 gap-y-2 text-xs font-body text-teal">
                    <span className="col-span-1 text-teal/50 font-medium">Paciente:</span>
                    <span className="col-span-2 text-teal font-bold text-right">
                      {appt.patient.firstName} {appt.patient.lastName}
                    </span>

                    <span className="col-span-1 text-teal/50 font-medium">Servicio:</span>
                    <span className="col-span-2 text-teal font-semibold text-right">
                      {serviceName}
                    </span>

                    <span className="col-span-1 text-teal/50 font-medium">Pago:</span>
                    <span className="col-span-2 text-teal font-semibold text-right">
                      {getPaymentLabel(appt.paymentMethod)} ({servicePrice})
                    </span>
                  </div>
                </div>

                {/* Footer (Notes Icon & Transition Buttons) */}
                <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    disabled={!hasNotes}
                    onClick={() => setNotesAppt(appt)}
                    className={`p-2 rounded-xl transition ${
                      hasNotes 
                        ? "text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 cursor-pointer" 
                        : "text-teal/20 bg-slate-50 border border-slate-100 cursor-not-allowed"
                    }`}
                    title={hasNotes ? "Ver Notas" : "Sin notas"}
                  >
                    <FileText size={15} />
                  </button>

                  <div className="flex items-center gap-1">
                    {appt.status === "BOOKED" && (
                      <>
                        <button
                          disabled={isAnyPending}
                          onClick={() => handleStatusTransition(appt, "CONFIRMED")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                            isPendingConfirm
                              ? "bg-blue-600 border-blue-700 text-white opacity-95 cursor-not-allowed"
                              : "bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {isPendingConfirm ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            "Confirmar"
                          )}
                        </button>
                        <button
                          disabled={isAnyPending}
                          onClick={() => handleStatusTransition(appt, "CANCELLED")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                            isPendingCancel
                              ? "bg-red-600 border-red-700 text-white opacity-95 cursor-not-allowed"
                              : "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {isPendingCancel ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            "Cancelar"
                          )}
                        </button>
                      </>
                    )}
                    {appt.status === "CONFIRMED" && (
                      <>
                        <button
                          disabled={isAnyPending}
                          onClick={() => handleStatusTransition(appt, "ATTENDED")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                            isPendingAttended
                              ? "bg-emerald-600 border-emerald-700 text-white opacity-95 cursor-not-allowed"
                              : "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {isPendingAttended ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            "Asistió"
                          )}
                        </button>
                        <button
                          disabled={isAnyPending}
                          onClick={() => handleStatusTransition(appt, "NO_SHOW")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                            isPendingNoShow
                              ? "bg-orange-600 border-orange-700 text-white opacity-95 cursor-not-allowed"
                              : "bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {isPendingNoShow ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            "No Asistió"
                          )}
                        </button>
                        <button
                          disabled={isAnyPending}
                          onClick={() => handleStatusTransition(appt, "CANCELLED")}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                            isPendingCancel
                              ? "bg-red-600 border-red-700 text-white opacity-95 cursor-not-allowed"
                              : "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {isPendingCancel ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            "Cancelar"
                          )}
                        </button>
                      </>
                    )}
                    {(appt.status === "ATTENDED" || appt.status === "NO_SHOW") && (
                      <button
                        disabled={isAnyPending}
                        onClick={() => handleStatusTransition(appt, "BOOKED")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                          isPendingBooked
                            ? "bg-slate-600 border-slate-700 text-white opacity-95 cursor-not-allowed"
                            : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        }`}
                      >
                        {isPendingBooked ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          "Reestablecer"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {!apptsLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-3xl border border-cream/30 shadow-xs font-body text-xs text-teal gap-3">
          <div>
            Mostrando <span className="font-bold">{((page - 1) * 15) + 1}</span> a{" "}
            <span className="font-bold">{Math.min(page * 15, totalCount)}</span> de{" "}
            <span className="font-bold">{totalCount}</span> citas
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-cream rounded-xl hover:bg-offwhite disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-medium px-2">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-cream rounded-xl hover:bg-offwhite disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {currentDetailAppt && (
        <AppointmentDetailModal
          appt={currentDetailAppt}
          onClose={() => setSelectedAppt(null)}
          onUpdate={handleModalUpdate}
          onDelete={handleDeleteClick}
          isUpdating={updateMutation.isPending}
        />
      )}

      {notesAppt && (
        <NotesModal
          appt={notesAppt}
          onClose={() => setNotesAppt(null)}
        />
      )}

      {cancellingAppt && (
        <CancelReasonModal
          appt={cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleCancelConfirm}
          isUpdating={updateMutation.isPending}
        />
      )}
    </div>
  );
}

/* --- Internal Modal Components --- */
