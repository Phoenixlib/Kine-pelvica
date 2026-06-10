"use client";

import { useState, useEffect } from "react";
import { X, Phone, Mail, MessageSquare, Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
import type { AppointmentStatus, PaymentMethod } from "../../../generated/prisma";
import { api } from "~/trpc/react";
import { addMinutes } from "date-fns";
import { detectSchedulingClash } from "~/utils/schedulingUtils";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Appointment {
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

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  BOOKED: "Reservada",
  CONFIRMED: "Confirmada",
  ATTENDED: "Asistió",
  NO_SHOW: "No Asistió",
  CANCELLED: "Cancelada",
};

export const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  BOOKED: { bg: "bg-amber-50/85", text: "text-amber-800", border: "border-amber-200/50" },
  CONFIRMED: { bg: "bg-blue-50/85", text: "text-blue-800", border: "border-blue-200/50" },
  ATTENDED: { bg: "bg-emerald-50/85", text: "text-emerald-800", border: "border-emerald-200/50" },
  NO_SHOW: { bg: "bg-orange-50/85", text: "text-orange-800", border: "border-orange-200/50" },
  CANCELLED: { bg: "bg-red-50/85", text: "text-red-800", border: "border-red-200/50" },
};

export const getPaymentLabel = (method: PaymentMethod | null) => {
  if (!method) return "Pendiente";
  const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    PENDING: "Pendiente",
    CASH_PENDING: "Efectivo Pendiente",
    TRANSFER: "Transferencia",
    CASH_PAID: "Efectivo Pagado",
  };
  return PAYMENT_LABELS[method] || "Pendiente";
};

export const getCleanPhone = (phone: string) => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("56")) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    return "56" + cleaned;
  }
  return "56" + cleaned;
};

export function AppointmentDetailModal({
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
    cancelReason?: string | null;
    date?: Date;
  }) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  const apptDate = typeof appt.date === "string" ? new Date(appt.date) : appt.date;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const initialDateStr = `${apptDate.getFullYear()}-${pad(apptDate.getMonth() + 1)}-${pad(apptDate.getDate())}`;
  const initialTimeStr = `${pad(apptDate.getHours())}:${pad(apptDate.getMinutes())}`;

  const [notes, setNotes] = useState(appt.notes || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(appt.paymentMethod || "PENDING");
  const [status, setStatus] = useState<AppointmentStatus>(appt.status);
  const [cancelReason, setCancelReason] = useState(appt.cancelReason || "");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cancelReasonError, setCancelReasonError] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr);
  const [selectedTime, setSelectedTime] = useState<string>(initialTimeStr);
  const [isEditingDate, setIsEditingDate] = useState(false);

  useEffect(() => {
    setNotes(appt.notes || "");
    setPaymentMethod(appt.paymentMethod || "PENDING");
    setStatus(appt.status);
    setCancelReason(appt.cancelReason || "");
    setShowCancelInput(appt.status === "CANCELLED");
    setConfirmDelete(false);
    setCancelReasonError(false);
    setIsEditingDate(false);

    const aDate = typeof appt.date === "string" ? new Date(appt.date) : appt.date;
    setSelectedDate(`${aDate.getFullYear()}-${pad(aDate.getMonth() + 1)}-${pad(aDate.getDate())}`);
    setSelectedTime(`${pad(aDate.getHours())}:${pad(aDate.getMinutes())}`);
  }, [appt]);

  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const { data: dayAppointments } = api.appointment.getAll.useQuery(
    {
      startDate: selectedDateObj ? new Date(selectedDateObj.getTime() - 24 * 60 * 60 * 1000) : undefined,
      endDate: selectedDateObj ? new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000) : undefined,
    },
    { enabled: !!selectedDateObj && isEditingDate }
  );

  const { data: dayBlocks } = api.blockedSlot.getAll.useQuery(
    {
      startDate: selectedDateObj ? new Date(selectedDateObj.getTime() - 24 * 60 * 60 * 1000) : new Date(),
      endDate: selectedDateObj ? new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000) : new Date(),
    },
    { enabled: !!selectedDateObj && isEditingDate }
  );

  let hasClash = false;
  if (isEditingDate) {
    hasClash = detectSchedulingClash(
      selectedDate,
      selectedTime,
      appt.durationMinutes,
      dayAppointments?.appointments,
      dayBlocks,
      appt.id
    );
  }

  const handleSave = () => {
    if (status === "CANCELLED" && !cancelReason.trim()) {
      setCancelReasonError(true);
      return;
    }

    if (isEditingDate && hasClash) {
      return;
    }

    let newDateObj: Date | undefined = undefined;
    if (isEditingDate) {
      newDateObj = new Date(`${selectedDate}T${selectedTime}:00`);
    }

    onUpdate({
      id: appt.id,
      notes: notes || null,
      paymentMethod,
      status,
      cancelReason: status === "CANCELLED" ? cancelReason : null,
      date: newDateObj,
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

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  return (
    <div className={`${isFullscreen ? "absolute" : "fixed"} inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-sm animate-in fade-in duration-300`}>
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

              {!isEditingDate ? (
                <div className="pt-2 border-t border-cream/10 text-xs flex justify-between items-end">
                  <div className="grid grid-cols-2 gap-4 flex-1">
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
                  {status !== "CANCELLED" && (
                    <button 
                      type="button" 
                      onClick={() => setIsEditingDate(true)}
                      className="text-[10px] font-bold uppercase tracking-wider text-terracotta hover:underline ml-2"
                    >
                      Reagendar
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-cream/10 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-teal">Reprogramar Cita</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingDate(false);
                        setSelectedDate(initialDateStr);
                        setSelectedTime(initialTimeStr);
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-teal/50 hover:underline"
                    >
                      Cancelar Cambio
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-teal/70">Fecha</label>
                      <input
                        type="date"
                        value={selectedDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-cream rounded-lg font-body text-xs text-teal focus:outline-none focus:border-terracotta transition-colors"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-teal/70">Hora</label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-cream rounded-lg font-body text-xs text-teal focus:outline-none focus:border-terracotta transition-colors"
                      />
                    </div>
                  </div>
                  {hasClash && (
                    <div className="bg-red-50 text-red-600 p-2 rounded-lg border border-red-100 text-[10px] font-bold flex items-center gap-1.5 mt-2">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ⛔ El horario está ocupado.
                    </div>
                  )}
                </div>
              )}
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
            disabled={isUpdating || (isEditingDate && hasClash)}
            className="flex-1 py-3 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
          >
            {isUpdating ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesModal({
  appt,
  onClose,
}: {
  appt: Appointment;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
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

export function CancelReasonModal({
  appt,
  onClose,
  onConfirm,
  isUpdating,
}: {
  appt: Appointment;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isUpdating?: boolean;
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
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
              disabled={isUpdating}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelación"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
