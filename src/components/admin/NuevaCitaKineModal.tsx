"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { addMinutes, startOfDay, endOfDay, isBefore, isAfter, isSameDay } from "date-fns";
import { getCleanPhone } from "./AppointmentDetailModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDateStr: string | null;
  onSuccess: () => void;
}

export default function NuevaCitaKineModal({
  isOpen,
  onClose,
  initialDateStr,
  onSuccess,
}: Props) {
  // General State
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(""); // HH:MM
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Patient State
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  
  // Existing Patient Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  
  // New Patient Form
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const utils = api.useUtils();
  const createMutation = api.appointment.create.useMutation();
  const createPatientMutation = api.patient.create.useMutation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: loadingSearch } = api.patient.getAll.useQuery(
    { searchQuery: debouncedSearch, limit: 5 },
    { enabled: debouncedSearch.length > 0 && !isCreatingPatient }
  );

  const { data: services = [] } = api.service.getAll.useQuery();

  // Load day appointments to check for clashes (48h window to avoid TZ issues)
  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const { data: dayAppointments } = api.appointment.getAll.useQuery(
    {
      startDate: selectedDateObj ? new Date(selectedDateObj.getTime() - 24 * 60 * 60 * 1000) : undefined,
      endDate: selectedDateObj ? new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000) : undefined,
    },
    { enabled: !!selectedDateObj && isOpen }
  );

  const { data: dayBlocks } = api.blockedSlot.getAll.useQuery(
    {
      startDate: selectedDateObj ? new Date(selectedDateObj.getTime() - 24 * 60 * 60 * 1000) : new Date(),
      endDate: selectedDateObj ? new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000) : new Date(),
    },
    { enabled: !!selectedDateObj && isOpen }
  );

  const selectedPatient = searchResults?.patients.find(p => p.id === selectedPatientId) || null;
  const selectedService = services.find(s => s.id === selectedServiceId);

  // Pre-fill date and time
  useEffect(() => {
    if (initialDateStr && isOpen) {
      const datePart = initialDateStr.substring(0, 10);
      setSelectedDate(datePart);

      if (initialDateStr.includes("T")) {
        const timePart = initialDateStr.substring(11, 16);
        if (timePart !== "00:00") {
          setSelectedTime(timePart);
        }
      }
    }
  }, [initialDateStr, isOpen]);

  // Check clashes
  let hasClash = false;
  if (selectedDate && selectedTime && selectedService && (dayAppointments || dayBlocks)) {
    const newStart = new Date(`${selectedDate}T${selectedTime}:00`);
    const newEnd = addMinutes(newStart, selectedService.duration);

    const hasApptClash = dayAppointments?.appointments.some((appt) => {
      const apptStart = new Date(appt.date);
      const apptEnd = addMinutes(apptStart, appt.durationMinutes);
      // Overlap condition: start < endB AND end > startB
      return newStart < apptEnd && newEnd > apptStart && appt.status !== "CANCELLED";
    }) ?? false;

    const hasBlockClash = dayBlocks?.some((block) => {
      const blockStart = new Date(block.startAt);
      const blockEnd = new Date(block.endAt);
      return newStart < blockEnd && newEnd > blockStart;
    }) ?? false;

    hasClash = hasApptClash || hasBlockClash;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (hasClash) {
      setCreateError("El horario seleccionado choca con otra cita existente o un bloqueo. Por favor elige un horario disponible.");
      return;
    }

    if (!selectedDate || !selectedTime || !selectedServiceId) {
      setCreateError("Faltan campos obligatorios.");
      return;
    }

    if (!isCreatingPatient && !selectedPatientId) {
      setCreateError("Debe seleccionar un paciente.");
      return;
    }

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    try {
      let finalPatientId = selectedPatientId;

      // 1. Create Patient if needed
      if (isCreatingPatient) {
        if (!newFirstName || !newLastName || !newPhone) {
          setCreateError("Faltan datos del nuevo paciente.");
          return;
        }
        const newPatient = await createPatientMutation.mutateAsync({
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
          email: newEmail || undefined,
        });
        finalPatientId = newPatient.id;
      }

      // 2. Create Appointment
      const dateObj = new Date(`${selectedDate}T${selectedTime}:00`);
      await createMutation.mutateAsync({
        patientId: finalPatientId,
        serviceId: selectedServiceId,
        title: service.name,
        date: dateObj,
        durationMinutes: service.duration,
        notes: notes || undefined,
        status: "CONFIRMED",
        paymentMethod: "PENDING"
      });

      // 3. Open WhatsApp link with pre-filled message
      const cleanPhone = getCleanPhone(isCreatingPatient ? newPhone : selectedPatient!.phone);
      const formattedDateStr = dateObj.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
      const formattedTimeStr = dateObj.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
      const serviceName = service.name;
      const patientFirstName = isCreatingPatient ? newFirstName : selectedPatient!.firstName;

      const waMessage = `Hola ${patientFirstName}, te escribo de Kinesiología Pélvica Camila Ortiz para confirmarte que tu cita para *${serviceName}* ha sido agendada con éxito.\n\n*Detalles de tu cita:*\n📅 *Fecha:* ${formattedDateStr}\n⏰ *Hora:* ${formattedTimeStr} hrs\n📍 *Ubicación:* Benigno Posadas 1884, Iquique, Chile\n\n¡Te esperamos!`;
      const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

      try {
        window.open(waLink, "_blank");
      } catch (e) {
        console.error("Error opening WhatsApp link:", e);
      }

      utils.appointment.getAll.invalidate();
      utils.patient.getAll.invalidate();
      onSuccess();
      onClose();
    } catch (err: any) {
      setCreateError(err.message || "Error al crear la cita o el paciente.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${isFullscreen ? "absolute" : "fixed"} inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-sm animate-in fade-in duration-300`}>
      <div className="relative bg-offwhite w-full max-w-2xl rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] text-teal/50 font-bold uppercase tracking-wider block">Agendamiento</span>
            <h3 className="font-title text-xl text-teal">Nueva reserva</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="new-appt-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Fecha y Hora en una fila */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                  Hora *
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                />
              </div>
            </div>

            {hasClash && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-xs font-bold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ⛔ El horario seleccionado está ocupado. Elige una hora distinta para continuar.
              </div>
            )}

            {/* Paciente */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                  Paciente *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingPatient(!isCreatingPatient)}
                  className="text-xs font-bold text-terracotta hover:text-terracotta/80 flex items-center gap-1 transition-colors"
                >
                  {isCreatingPatient ? "Buscar paciente existente" : "+ Agregar paciente"}
                </button>
              </div>

              {isCreatingPatient ? (
                <div className="p-4 rounded-xl border border-terracotta/30 bg-terracotta/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-teal/70 font-bold">Nombre *</label>
                      <input 
                        type="text" required value={newFirstName} onChange={e => setNewFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-cream rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-teal/70 font-bold">Apellido *</label>
                      <input 
                        type="text" required value={newLastName} onChange={e => setNewLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-cream rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-teal/70 font-bold">Teléfono *</label>
                      <input 
                        type="tel" required value={newPhone} onChange={e => setNewPhone(e.target.value)}
                        placeholder="+569..."
                        className="w-full px-3 py-2 bg-white border border-cream rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-teal/70 font-bold">Email (Opcional)</label>
                      <input 
                        type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-cream rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {!selectedPatient ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Busca por nombre, apellido o teléfono..."
                        className="w-full px-4 py-2.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                      />
                      {loadingSearch && (
                        <p className="text-[10px] absolute right-3 top-3 text-teal/50">Buscando...</p>
                      )}
                      {(searchResults?.patients.length ?? 0) > 0 && (
                        <div className="absolute z-10 w-full mt-1 border border-cream rounded-xl max-h-48 overflow-y-auto divide-y divide-cream/30 bg-white shadow-xl">
                          {searchResults?.patients.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => setSelectedPatientId(patient.id)}
                              className="w-full text-left px-4 py-3 hover:bg-cream/10 text-sm transition-colors flex justify-between items-center"
                            >
                              <div>
                                <p className="font-bold text-teal">
                                  {patient.firstName} {patient.lastName}
                                </p>
                                <p className="text-[11px] text-teal/60 font-medium">
                                  {patient.phone} {patient.email ? `| ${patient.email}` : ""}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-teal/20 bg-teal/5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-teal">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                        <p className="text-[11px] text-teal/60 font-medium">
                          {selectedPatient.phone}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedPatientId(""); setSearchQuery(""); }}
                        className="text-xs font-bold text-terracotta hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Profesional (Read Only) */}
            <div className="space-y-1.5 opacity-70">
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                Profesional
              </label>
              <div className="w-full px-4 py-2.5 bg-cream/20 border border-cream rounded-xl font-body text-sm text-teal flex items-center justify-between">
                <span>Estudio Pélvico Camila Ortiz</span>
                <svg className="w-4 h-4 text-teal/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
            </div>

            {/* Servicio */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                Servicios *
              </label>
              <select
                required
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
              >
                <option value="">Busca un servicio...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration} min) - ${s.price.toLocaleString("es-CL")}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal/70">
                Información adicional (Notas)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observaciones de la reserva..."
                className="w-full px-4 py-2.5 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors resize-none"
              />
            </div>

            {createError && (
              <p className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 font-bold">
                {createError}
              </p>
            )}
          </form>
        </div>

        {/* Footer Actions */}
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
            form="new-appt-form"
            disabled={createMutation.isPending || createPatientMutation.isPending || hasClash}
            className="px-8 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl font-subtitle font-bold text-[11px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Guardar Reserva
          </button>
        </div>
      </div>
    </div>
  );
}
