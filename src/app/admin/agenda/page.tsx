"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  startOfDay, 
  endOfDay 
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  Clock, 
  User as UserIcon, 
  X, 
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form fields
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("Evaluación Pélvica");
  const [serviceCategory, setServiceCategory] = useState("ATENCIONES PÉLVICAS");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [amountPaid, setAmountPaid] = useState(30000);
  const [notes, setNotes] = useState("");
  const [isSuccessMessageOpen, setIsSuccessMessageOpen] = useState(false);

  const utils = api.useUtils();
  const { data: appointments, isLoading: apptsLoading } = api.appointment.getAll.useQuery();
  const { data: patients, isLoading: patientsLoading } = api.patient.getAll.useQuery();

  const createAppointment = api.appointment.create.useMutation({
    onSuccess: async () => {
      await utils.appointment.getAll.invalidate();
      await utils.stats.getDashboardStats.invalidate();
      setIsModalOpen(false);
      setIsSuccessMessageOpen(true);
      setTimeout(() => setIsSuccessMessageOpen(false), 3000);
      
      // Reset form
      setPatientId("");
      setNotes("");
    }
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 11 }).map((_, i) => i + 8); // 8 AM to 6 PM

  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const setToday = () => setCurrentDate(new Date());

  const getPatientName = (id: string) => patients?.find(p => p.id === id)?.name || 'Paciente Desconocido';

  const handleExport = () => {
    // Generate and download a simple calendar print/csv simulation
    const headers = ["Fecha", "Hora", "Paciente", "Servicio", "Duracion", "Estado"];
    const rows = (appointments || []).map(appt => {
      const d = new Date(appt.date);
      return [
        d.toLocaleDateString("es-CL"),
        d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        getPatientName(appt.patientId),
        appt.title,
        `${appt.durationMinutes} min`,
        appt.status
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `agenda-${format(currentDate, "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !apptDate || !apptTime) {
      alert("Por favor completa los campos requeridos");
      return;
    }

    const fullDate = new Date(`${apptDate}T${apptTime}:00`);

    createAppointment.mutate({
      patientId,
      title,
      serviceCategory,
      date: fullDate,
      durationMinutes: Number(durationMinutes),
      status: "Confirmed",
      paymentStatus: paymentStatus as any,
      amountPaid: Number(amountPaid),
      notes,
    });
  };

  const loading = apptsLoading || patientsLoading;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl text-teal">Agenda / Calendario</h1>
          <p className="font-body text-sm text-teal/70 mt-1">
            Visualiza y gestiona las citas semanales de la consulta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream hover:bg-offwhite text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-xs"
          >
            <Download size={14} className="text-terracotta" /> Exportar CSV
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white hover:bg-teal/90 text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-md"
          >
            <Plus size={14} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Success notification banner */}
      {isSuccessMessageOpen && (
        <div className="bg-[#f7f3ef] border border-terracotta/30 text-teal px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in duration-300">
          <CheckCircle size={18} className="text-[#c48a6a]" />
          <p className="font-body text-sm font-medium">¡Cita agendada exitosamente!</p>
        </div>
      )}

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-3xl border border-cream/30 shadow-xs flex flex-col h-[calc(100vh-14rem)] overflow-hidden">
        {/* Navigation controls */}
        <div className="p-4 border-b border-cream/30 bg-offwhite/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl shadow-xs border border-cream overflow-hidden">
              <button 
                onClick={prevWeek} 
                className="p-2.5 bg-white hover:bg-offwhite text-teal/70 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={setToday}
                className="px-4 py-2 bg-white hover:bg-offwhite font-subtitle text-[10px] uppercase tracking-widest font-bold border-x border-cream text-teal"
              >
                Hoy
              </button>
              <button 
                onClick={nextWeek} 
                className="p-2.5 bg-white hover:bg-offwhite text-teal/70 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            <h2 className="text-sm font-subtitle font-bold uppercase tracking-wider text-teal">
              {format(weekStart, 'MMMM yyyy')}
            </h2>
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cream border-t-terracotta rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto flex">
            {/* Time Sidebar */}
            <div className="w-16 flex-none border-r border-cream/30 pt-12 bg-offwhite/10">
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-cream/10 text-right pr-3 flex items-center justify-end">
                  <span className="text-[10px] font-subtitle font-bold text-teal/40">
                    {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 min-w-[900px]">
              {weekDays.map(day => (
                <div key={day.toISOString()} className="flex flex-col border-r border-cream/30">
                  {/* Day Header */}
                  <div className="h-12 border-b border-cream/30 flex flex-col items-center justify-center bg-offwhite/30">
                    <span className="text-[9px] font-subtitle font-bold uppercase tracking-widest text-teal/45">{format(day, 'EEE')}</span>
                    <span className={`text-xs font-subtitle font-bold mt-0.5 w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-[#c48a6a] text-white shadow-xs' : 'text-teal'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  {/* Day Slots */}
                  <div className="flex-1 relative pb-20 bg-offwhite/5">
                    {hours.map(hour => (
                      <div key={hour} className="h-20 border-b border-cream/10"></div>
                    ))}

                    {/* Render Appointments */}
                    {appointments
                      ?.filter(a => isSameDay(new Date(a.date), day))
                      .map(appt => {
                        const d = new Date(appt.date);
                        const startHour = d.getHours() + d.getMinutes() / 60;
                        if (startHour < 8 || startHour > 18) return null;
                        
                        const top = (startHour - 8) * 80; // 80px per hour
                        const height = (appt.durationMinutes / 60) * 80;

                        return (
                          <div 
                            key={appt.id}
                            className="absolute left-1 right-1 rounded-2xl p-2.5 text-[11px] overflow-hidden shadow-xs border flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: appt.status === 'Confirmed' ? '#ecfdf5' : '#fffbeb',
                              borderColor: appt.status === 'Confirmed' ? '#a7f3d0' : '#fde68a',
                              color: appt.status === 'Confirmed' ? '#064e3b' : '#78350f'
                            }}
                          >
                            <div>
                              <div className="font-subtitle font-bold uppercase tracking-wide truncate">{appt.title}</div>
                              <div className="font-body opacity-85 mt-0.5 truncate font-medium">{getPatientName(appt.patientId)}</div>
                            </div>
                            <div className="font-subtitle text-[9px] font-bold opacity-75 mt-1 flex items-center gap-1">
                              <Clock size={10} /> {format(d, 'h:mm a')}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-lg rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-terracotta" size={20} />
                <h3 className="font-title text-xl text-teal">Agendar Nueva Cita</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Select Patient */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Paciente *
                </label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                >
                  <option value="">Selecciona un paciente...</option>
                  {patients?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Title / Service */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Servicio / Terapia *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Evaluación de Suelo Pélvico"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Categoría del Servicio
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                >
                  <option value="ATENCIONES PÉLVICAS">ATENCIONES PÉLVICAS</option>
                  <option value="PREPARACIÓN DURANTE EL EMBARAZO">PREPARACIÓN DURANTE EL EMBARAZO</option>
                  <option value="DRENAJE-CICATRICES-MASAJES">DRENAJE-CICATRICES-MASAJES</option>
                  <option value="RESPIRATORIO">RESPIRATORIO</option>
                  <option value="Servicios empresas">Servicios empresas</option>
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                  />
                </div>
              </div>

              {/* Duration and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Monto Cobrado ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                  />
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Estado de Pago
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                >
                  <option value="Paid">Pagado</option>
                  <option value="Unpaid">Impago</option>
                  <option value="Partial">Pago Parcial</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Notas de la Cita
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Comentarios adicionales sobre el agendamiento..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createAppointment.isPending}
                  className="flex-1 py-3.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
                >
                  {createAppointment.isPending ? "Guardando..." : "Crear Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
