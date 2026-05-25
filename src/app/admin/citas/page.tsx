"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Calendar as CalendarIcon, 
  CreditCard,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rut: string | null;
}

interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  title: string;
  serviceCategory: string | null;
  date: Date | string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  amountPaid: number | null;
  notes: string | null;
}

export default function CitasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // Editing state
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("Confirmed");
  const [editPaymentStatus, setEditPaymentStatus] = useState("Unpaid");
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  const utils = api.useUtils();
  const { data: appointments, isLoading: apptsLoading } = api.appointment.getAll.useQuery();

  const updateMutation = api.appointment.update.useMutation({
    onSuccess: async () => {
      await utils.appointment.getAll.invalidate();
      await utils.stats.getDashboardStats.invalidate();
      setEditingAppt(null);
    }
  });

  const deleteMutation = api.appointment.delete.useMutation({
    onSuccess: async () => {
      await utils.appointment.getAll.invalidate();
      await utils.stats.getDashboardStats.invalidate();
    }
  });

  const handleEditClick = (appt: Appointment) => {
    setEditingAppt(appt);
    setEditTitle(appt.title);
    setEditStatus(appt.status);
    setEditPaymentStatus(appt.paymentStatus);
    setEditAmountPaid(appt.amountPaid || 0);
    setEditNotes(appt.notes || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;

    updateMutation.mutate({
      id: editingAppt.id,
      title: editTitle,
      date: new Date(editingAppt.date),
      durationMinutes: editingAppt.durationMinutes,
      status: editStatus as "Confirmed" | "Pending" | "Cancelled",
      paymentStatus: editPaymentStatus as "Paid" | "Unpaid" | "Partial",
      amountPaid: Number(editAmountPaid),
      notes: editNotes,
    });
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("¿Estás segura de que deseas eliminar esta cita?")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredAppts = appointments?.filter((appt) => {
    const matchSearch = appt.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        appt.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = statusFilter === "All" || appt.status === statusFilter;
    const matchPayment = paymentFilter === "All" || appt.paymentStatus === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h1 className="font-title text-3xl text-teal">Directorio de Citas</h1>
        <p className="font-body text-sm text-teal/70 mt-1">
          Busca, edita, filtra y elimina los agendamientos de tu consulta médica.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-cream/30 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal/30 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por paciente o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-offwhite border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors placeholder:text-teal/30"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-offwhite border border-cream rounded-xl font-body text-xs text-teal focus:outline-none"
          >
            <option value="All">Todos los Estados</option>
            <option value="Confirmed">Confirmadas</option>
            <option value="Pending">Pendientes</option>
            <option value="Cancelled">Canceladas</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2.5 bg-offwhite border border-cream rounded-xl font-body text-xs text-teal focus:outline-none"
          >
            <option value="All">Todos los Pagos</option>
            <option value="Paid">Pagadas</option>
            <option value="Unpaid">Impagas</option>
            <option value="Partial">Pago Parcial</option>
          </select>
        </div>
      </div>

      {/* Table Container (Desktop Only) */}
      <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body text-teal">
            <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Cita / Terapia</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Estado Cita</th>
                <th className="px-6 py-4">Estado Pago</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/10">
              {apptsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-teal/40 font-medium">
                    <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando citas...
                  </td>
                </tr>
              ) : filteredAppts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-teal/50 font-medium">
                    No se encontraron agendamientos.
                  </td>
                </tr>
              ) : (
                filteredAppts.map((appt) => {
                  const date = new Date(appt.date);
                  return (
                    <tr key={appt.id} className="hover:bg-offwhite/30 transition-colors">
                      <td className="px-6 py-4 font-subtitle font-bold text-teal">{appt.patient.name}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{appt.title}</span>
                        {appt.serviceCategory && (
                          <span className="block text-[9px] text-teal/45 font-bold uppercase tracking-wide mt-0.5">{appt.serviceCategory}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold block">{date.toLocaleDateString("es-CL")}</span>
                        <span className="text-[10px] text-teal/60">{date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider ${
                          appt.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : appt.status === "Pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                        }`}>
                          {appt.status === "Confirmed" ? "Confirmada" : appt.status === "Pending" ? "Pendiente" : "Cancelada"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider ${
                          appt.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : appt.paymentStatus === "Partial"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                        }`}>
                          {appt.paymentStatus === "Paid" ? "Pagado" : appt.paymentStatus === "Partial" ? "Parcial" : "Impago"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal/80">
                        ${appt.amountPaid?.toLocaleString("es-CL")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(appt)}
                            className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition"
                            title="Editar Cita"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(appt.id)}
                            className="p-2 text-redbrown/60 hover:text-redbrown hover:bg-redbrown/5 rounded-xl transition"
                            title="Eliminar Cita"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Mobile Cards Container (Visible on Mobile Only) */}
      <div className="md:hidden space-y-4">
        {apptsLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
            <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
            Cargando citas...
          </div>
        ) : filteredAppts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium">
            No se encontraron agendamientos.
          </div>
        ) : (
          filteredAppts.map((appt) => {
            const date = new Date(appt.date);
            const weekday = date.toLocaleDateString("es-CL", { weekday: 'short' });
            const day = date.toLocaleDateString("es-CL", { day: 'numeric' });
            const month = date.toLocaleDateString("es-CL", { month: 'short' });
            const cleanWeekday = weekday.replace('.', '');
            const cleanMonth = month.replace('.', '');
            const formattedDate = `${cleanWeekday.charAt(0).toUpperCase() + cleanWeekday.slice(1)}, ${day} ${cleanMonth.charAt(0).toUpperCase() + cleanMonth.slice(1)}`;
            const formattedTime = date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={appt.id} className="bg-white p-5 rounded-3xl border border-cream/30 shadow-xs space-y-3">
                {/* Header (Date & Status Badge) */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-subtitle font-bold text-teal text-sm leading-tight">{formattedDate}</h4>
                    <span className="text-[11px] text-teal/60 font-body">{formattedTime} hrs</span>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-subtitle font-bold uppercase tracking-wider ${
                    appt.status === "Confirmed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : appt.status === "Pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                  }`}>
                    {appt.status === "Confirmed" ? "Confirmada" : appt.status === "Pending" ? "Pendiente" : "Cancelada"}
                  </span>
                </div>

                {/* Details Box */}
                <div className="bg-offwhite/50 border border-cream/20 rounded-2xl p-4">
                  <div className="grid grid-cols-3 gap-y-2 text-xs font-body text-teal">
                    <span className="col-span-1 text-teal/50 font-medium">Paciente:</span>
                    <span className="col-span-2 text-teal font-bold text-right">{appt.patient.name}</span>

                    {appt.patient.rut && (
                      <>
                        <span className="col-span-1 text-teal/50 font-medium">RUT:</span>
                        <span className="col-span-2 text-teal font-semibold text-right">{appt.patient.rut}</span>
                      </>
                    )}

                    {(appt.patient.phone || appt.patient.email) && (
                      <>
                        <span className="col-span-1 text-teal/50 font-medium">Contacto:</span>
                        <div className="col-span-2 text-right flex flex-col items-end text-[11px] leading-tight">
                          {appt.patient.phone && <span>{appt.patient.phone}</span>}
                          {appt.patient.email && <span className="text-[10px] text-teal/70 break-all">{appt.patient.email}</span>}
                        </div>
                      </>
                    )}

                    <span className="col-span-1 text-teal/50 font-medium mt-1">Servicio:</span>
                    <div className="col-span-2 text-right mt-1">
                      <span className="text-teal font-semibold block">{appt.title}</span>
                      {appt.serviceCategory && (
                        <span className="text-[9px] text-teal/45 font-bold uppercase tracking-wide">{appt.serviceCategory}</span>
                      )}
                    </div>

                    <span className="col-span-1 text-teal/50 font-medium mt-1">Pago:</span>
                    <div className="col-span-2 text-right flex flex-col items-end gap-1 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-subtitle font-bold uppercase tracking-wider ${
                        appt.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : appt.paymentStatus === "Partial"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                      }`}>
                        {appt.paymentStatus === "Paid" ? "Pagado" : appt.paymentStatus === "Partial" ? "Parcial" : "Impago"}
                      </span>
                      <span className="text-teal/80 font-bold text-xs">${appt.amountPaid?.toLocaleString("es-CL")}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleEditClick(appt)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-teal bg-offwhite hover:bg-cream/20 rounded-xl font-subtitle font-bold text-[10px] uppercase tracking-wider transition border border-cream/50"
                  >
                    <Edit3 size={12} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(appt.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-redbrown bg-redbrown/5 hover:bg-redbrown/10 rounded-xl font-subtitle font-bold text-[10px] uppercase tracking-wider transition border border-redbrown/10"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Appointment Modal */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-title text-xl text-teal">Editar Cita de {editingAppt.patient.name}</h3>
              <button 
                onClick={() => setEditingAppt(null)}
                className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Servicio / Terapia
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Estado de la Cita
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                >
                  <option value="Confirmed">Confirmada</option>
                  <option value="Pending">Pendiente</option>
                  <option value="Cancelled">Cancelada</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Estado de Pago
                </label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                >
                  <option value="Paid">Pagado</option>
                  <option value="Unpaid">Impago</option>
                  <option value="Partial">Pago Parcial</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Monto Cobrado ($)
                </label>
                <input
                  type="number"
                  required
                  value={editAmountPaid}
                  onChange={(e) => setEditAmountPaid(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Notas / Detalles Clínicos
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAppt(null)}
                  className="flex-1 py-3.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 py-3.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
