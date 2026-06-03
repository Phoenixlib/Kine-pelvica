"use client";

import { useState, useEffect } from "react";
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

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  title: string;
  serviceId: string | null;
  service: Service | null;
  date: Date | string;
  durationMinutes: number;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod | null;
  cancelReason: string | null;
  notes: string | null;
  calComEventId: string | null;
  calComBookingId: string | null;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  BOOKED: "Reservada",
  CONFIRMED: "Confirmada",
  ATTENDED: "Asistió",
  NO_SHOW: "No Asistió",
  CANCELLED: "Cancelada",
};

const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  BOOKED: { bg: "bg-amber-50/85", text: "text-amber-800", border: "border-amber-200/50" },
  CONFIRMED: { bg: "bg-blue-50/85", text: "text-blue-800", border: "border-blue-200/50" },
  ATTENDED: { bg: "bg-emerald-50/85", text: "text-emerald-800", border: "border-emerald-200/50" },
  NO_SHOW: { bg: "bg-orange-50/85", text: "text-orange-800", border: "border-orange-200/50" },
  CANCELLED: { bg: "bg-red-50/85", text: "text-red-800", border: "border-red-200/50" },
};

const getPaymentLabel = (method: PaymentMethod | null) => {
  if (!method) return "Pendiente";
  const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    PENDING: "Pendiente",
    CASH_PENDING: "Efectivo Pendiente",
    TRANSFER: "Transferencia",
    CASH_PAID: "Efectivo Pagado",
  };
  return PAYMENT_LABELS[method] || "Pendiente";
};

const getCleanPhone = (phone: string) => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("56")) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    return "56" + cleaned;
  }
  return "56" + cleaned;
};

export default function CitasPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selection states for modals
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [notesAppt, setNotesAppt] = useState<Appointment | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const utils = api.useUtils();

  // Reset page on search or filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: appointmentsData, isLoading: apptsLoading } = api.appointment.getAll.useQuery({
    page,
    limit: 15,
    status: statusFilter === "All" ? undefined : (statusFilter as AppointmentStatus),
    searchQuery: searchQuery || undefined,
  }, {
    placeholderData: (previousData) => previousData,
  });

  const appointmentsList = appointmentsData?.appointments as unknown as Appointment[] || [];
  const totalPages = appointmentsData?.totalPages || 1;
  const totalCount = appointmentsData?.total || 0;

  const updateMutation = api.appointment.update.useMutation({
    onSuccess: async () => {
      await utils.appointment.getAll.invalidate();
      await utils.stats.getDashboardStats.invalidate();
      
      // Reset transition states
      setCancellingAppt(null);
      setCancelReason("");
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-offwhite border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
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
      <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body text-teal">
            <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Cita / Terapia</th>
                <th className="px-6 py-4">Medio de Pago</th>
                <th className="px-6 py-4">Precio Servicio</th>
                <th className="px-6 py-4 text-center">Notas</th>
                <th className="px-6 py-4">Estado Cita</th>
                <th className="px-6 py-4 text-right">Cambiar Estado</th>
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
                      <td className="px-6 py-4">
                        <span className="font-semibold block">{formattedDate}</span>
                        <span className="text-[10px] text-teal/60">{formattedTime} hrs</span>
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
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
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
        />
      )}
    </div>
  );
}

/* --- Internal Modal Components --- */

function AppointmentDetailModal({
  appt,
  onClose,
  onUpdate,
  onDelete,
  isUpdating,
}: {
  appt: Appointment;
  onClose: () => void;
  onUpdate: (data: { 
    id: string; 
    status?: AppointmentStatus; 
    paymentMethod?: PaymentMethod | null; 
    notes?: string | null; 
    cancelReason?: string | null 
  }) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  const [notes, setNotes] = useState(appt.notes || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(appt.paymentMethod || "PENDING");
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);
  const [cancelReason, setCancelReason] = useState(appt.cancelReason || "");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cancelReasonError, setCancelReasonError] = useState(false);

  useEffect(() => {
    setNotes(appt.notes || "");
    setPaymentMethod(appt.paymentMethod || "PENDING");
    setStatus(appt.status);
    setCancelReason(appt.cancelReason || "");
    setShowCancelInput(appt.status === "CANCELLED");
    setConfirmDelete(false);
    setCancelReasonError(false);
  }, [appt]);

  const handleSave = () => {
    if (status === "CANCELLED" && !cancelReason.trim()) {
      setCancelReasonError(true);
      return;
    }

    onUpdate({
      id: appt.id,
      notes: notes || null,
      paymentMethod,
      status,
      cancelReason: status === "CANCELLED" ? cancelReason : null,
    });
    onClose();
  };

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    setStatus(newStatus);
    if (newStatus === "CANCELLED") {
      setShowCancelInput(true);
    } else {
      setShowCancelInput(false);
      setCancelReasonError(false);
    }
  };

  const cleanPhone = getCleanPhone(appt.patient.phone);
  const dateObj = new Date(appt.date);
  const formattedDateStr = dateObj.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const formattedTimeStr = dateObj.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const serviceName = appt.service ? appt.service.name : appt.title;
  
  const waMessage = `Hola ${appt.patient.firstName}, te escribo de Kinesiología Pélvica Camila Ortiz para recordarte tu cita de ${serviceName} el día ${formattedDateStr} a las ${formattedTimeStr} hrs. Por favor, confírmanos tu asistencia. ¡Que tengas un excelente día!`;
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative bg-offwhite w-full max-w-lg rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] text-teal/50 font-bold uppercase tracking-wider block">Detalle de la Cita</span>
            <h3 className="font-title text-xl text-teal">
              {appt.patient.firstName} {appt.patient.lastName}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Details */}
          <div className="space-y-3">
            <h4 className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal/50 border-b border-cream/20 pb-1">Paciente</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body text-teal">
              <div>
                <span className="text-teal/60 block">Teléfono</span>
                <a href={`tel:${appt.patient.phone}`} className="font-bold hover:text-terracotta transition-colors flex items-center gap-1.5 mt-0.5">
                  <Phone size={12} className="text-teal/40" />
                  {appt.patient.phone}
                </a>
              </div>
              {appt.patient.email && (
                <div>
                  <span className="text-teal/60 block">Correo Electrónico</span>
                  <a href={`mailto:${appt.patient.email}`} className="font-bold hover:text-terracotta transition-colors flex items-center gap-1.5 mt-0.5 break-all">
                    <Mail size={12} className="text-teal/40" />
                    {appt.patient.email}
                  </a>
                </div>
              )}
            </div>

            {/* WhatsApp button */}
            <div className="pt-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all w-full justify-center shadow-xs"
              >
                <MessageSquare size={14} />
                Enviar Recordatorio por WhatsApp
              </a>
            </div>
          </div>

          {/* Service & Time details */}
          <div className="space-y-3">
            <h4 className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal/50 border-b border-cream/20 pb-1">Servicio y Horario</h4>
            <div className="bg-white rounded-2xl p-4 border border-cream/30 space-y-3 text-xs font-body text-teal">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm block">{serviceName}</span>
                  <span className="text-teal/50 mt-0.5 block">{appt.durationMinutes} minutos de duración</span>
                </div>
                {appt.service && (
                  <span className="font-bold text-sm text-terracotta">
                    ${appt.service.price.toLocaleString("es-CL")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-cream/10 text-xs">
                <div>
                  <span className="text-teal/50 block font-medium">Fecha</span>
                  <span className="font-bold capitalize flex items-center gap-1.5 mt-0.5">
                    <CalendarIcon size={12} className="text-teal/40" />
                    {dateObj.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </div>
                <div>
                  <span className="text-teal/50 block font-medium">Hora</span>
                  <span className="font-bold flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} className="text-teal/40" />
                    {formattedTimeStr} hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration / Administration */}
          <div className="space-y-4">
            <h4 className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal/50 border-b border-cream/20 pb-1">Administración</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal/70 block">
                  Estado de la Cita
                </label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as AppointmentStatus)}
                  disabled={appt.status === "CANCELLED"}
                  className="w-full px-3 py-2.5 bg-white border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors disabled:bg-slate-50 disabled:text-teal/40 disabled:cursor-not-allowed"
                >
                  <option value="BOOKED">Reservada</option>
                  <option value="CONFIRMED">Confirmada</option>
                  <option value="ATTENDED">Asistió</option>
                  <option value="NO_SHOW">No Asistió</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal/70 block">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2.5 bg-white border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="CASH_PENDING">Efectivo Pendiente</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CASH_PAID">Efectivo Pagado</option>
                </select>
              </div>
            </div>

            {/* Cancel Reason (Only show if Cancelled) */}
            {(status === "CANCELLED" || showCancelInput) && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-red-700 block">
                  Motivo de Cancelación *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (e.target.value.trim()) {
                      setCancelReasonError(false);
                    }
                  }}
                  placeholder="Indica el motivo de la cancelación para sincronizar con Cal.com..."
                  rows={2}
                  className={`w-full px-3 py-2 bg-white border rounded-xl font-body text-xs text-teal focus:outline-none resize-none transition-colors ${
                    cancelReasonError 
                      ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600" 
                      : "border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  }`}
                />
                {cancelReasonError && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">
                    El motivo de cancelación es obligatorio
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal/70 block">
                Notas / Detalles Clínicos
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de la sesión..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta resize-none"
              />
            </div>
          </div>

          {/* Delete Area */}
          <div className="pt-4 border-t border-cream/20">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-semibold text-redbrown/70 hover:text-redbrown transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                Eliminar cita permanentemente
              </button>
            ) : (
              <div className="bg-red-50/50 border border-red-200 rounded-2xl p-4 space-y-3">
                <p className="text-[11px] text-red-800 font-medium leading-relaxed">
                  ¿Estás segura? Esto eliminará la cita de la base de datos de manera irreversible. Si la cita está vinculada a Cal.com, se recomienda cancelarla en lugar de eliminarla.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onDelete(appt.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 bg-white border border-cream text-teal rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cream/30 bg-white flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
            className="flex-1 py-3 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
          >
            {isUpdating ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesModal({
  appt,
  onClose,
}: {
  appt: Appointment;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-amber-500 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-teal/50 font-bold uppercase tracking-wider block">Notas de Cal.com</span>
            <h3 className="font-title text-base text-teal">
              Paciente: {appt.patient.firstName} {appt.patient.lastName}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-cream/30 min-h-[120px] text-xs font-body text-teal leading-relaxed whitespace-pre-wrap">
            {appt.notes || "Sin notas adicionales."}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cream/30 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelReasonModal({
  appt,
  onClose,
  onConfirm,
}: {
  appt: Appointment;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(true);
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-red-500 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Confirmar Cancelación</span>
            <h3 className="font-title text-base text-teal">
              Cita de {appt.patient.firstName} {appt.patient.lastName}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-4">
            <p className="text-xs text-teal/70 font-body leading-relaxed">
              La cancelación se sincronizará con Cal.com. Por favor, ingresa el motivo de la cancelación (este campo es obligatorio):
            </p>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) {
                  setError(false);
                }
              }}
              placeholder="Ej. El paciente solicitó cambiar de hora o no puede asistir..."
              rows={3}
              className={`w-full px-3 py-2 bg-white border rounded-xl font-body text-xs text-teal focus:outline-none resize-none transition-colors ${
                error 
                  ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600" 
                  : "border-cream focus:border-red-500 focus:ring-1 focus:ring-red-500"
              }`}
            />
            {error && (
              <p className="text-red-500 text-[10px] font-bold mt-1">
                El motivo de cancelación es obligatorio
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-cream/30 bg-white flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-xs"
            >
              Confirmar Cancelación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
