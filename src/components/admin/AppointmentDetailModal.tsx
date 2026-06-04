"use client";

import { useState, useEffect } from "react";
import { X, Phone, Mail, MessageSquare, Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
import type { AppointmentStatus, PaymentMethod } from "../../../generated/prisma";

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

export function NotesModal({
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

export function CancelReasonModal({
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
