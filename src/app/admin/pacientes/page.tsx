"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  X, 
  Phone,
  Mail,
  Calendar
} from "lucide-react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  rut: string | null;
  birthDate: Date | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  appointments: Array<{
    id: string;
    date: Date | string;
    title: string;
    status: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface Appointment {
  id: string;
  patientId: string;
  calComEventId: string | null;
  title: string;
  date: Date | string;
  durationMinutes: number;
  status: string;
  notes: string | null;
}

interface SelectedPatient extends Omit<Patient, "appointments"> {
  appointments?: Appointment[];
}

export default function PacientesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add Patient form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addRut, setAddRut] = useState("");
  const [addBirthDate, setAddBirthDate] = useState("");
  const [addNotes, setAddNotes] = useState("");

  // Clinical File view/edit state
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [isClinicalModalOpen, setIsClinicalModalOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Edit patient profile info
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRut, setEditRut] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const utils = api.useUtils();
  const { data: patientData, isLoading: patientsLoading } = api.patient.getAll.useQuery({
    page,
    limit: 20,
    searchQuery: debouncedSearchQuery,
  });

  const patientsList = patientData?.patients || [];
  const totalPages = patientData?.totalPages || 1;

  const createPatientMutation = api.patient.create.useMutation({
    onSuccess: async () => {
      await utils.patient.getAll.invalidate();
      setIsAddModalOpen(false);
      resetAddForm();
    }
  });

  const updatePatientMutation = api.patient.update.useMutation({
    onSuccess: async () => {
      await utils.patient.getAll.invalidate();
      setIsEditProfileModalOpen(false);
      if (editingPatient && selectedPatient?.id === editingPatient.id) {
        // Update selected patient cache if open
        const updated = await utils.patient.getById.fetch({ id: editingPatient.id });
        setSelectedPatient(updated as SelectedPatient);
      }
    }
  });

  const deletePatientMutation = api.patient.delete.useMutation({
    onSuccess: async () => {
      await utils.patient.getAll.invalidate();
    }
  });

  const resetAddForm = () => {
    setAddFirstName("");
    setAddLastName("");
    setAddEmail("");
    setAddPhone("");
    setAddRut("");
    setAddBirthDate("");
    setAddNotes("");
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName || !addLastName) return;

    createPatientMutation.mutate({
      firstName: addFirstName,
      lastName: addLastName,
      email: addEmail,
      phone: addPhone,
      rut: addRut,
      birthDate: addBirthDate ? new Date(addBirthDate) : undefined,
      notes: addNotes,
      status: "ACTIVE",
    });
  };

  const handleEditProfileClick = (patient: any) => {
    setEditingPatient(patient);
    setEditFirstName(patient.firstName);
    setEditLastName(patient.lastName);
    setEditEmail(patient.email || "");
    setEditPhone(patient.phone || "");
    setEditRut(patient.rut || "");
    setEditBirthDate(patient.birthDate ? (new Date(patient.birthDate).toISOString().split('T')[0] ?? "") : "");
    setEditStatus(patient.status || "ACTIVE");
    setIsEditProfileModalOpen(true);
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient || !editFirstName || !editLastName) return;

    updatePatientMutation.mutate({
      id: editingPatient.id,
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      phone: editPhone,
      rut: editRut,
      birthDate: editBirthDate ? new Date(editBirthDate) : undefined,
      notes: editingPatient.notes ?? undefined,
      status: editStatus,
    });
  };

  const handleViewClinicalFile = async (patient: any) => {
    try {
      const fullPatient = await utils.patient.getById.fetch({ id: patient.id });
      setSelectedPatient(fullPatient as SelectedPatient);
      setClinicalNotes(fullPatient?.notes || "");
      setIsClinicalModalOpen(true);
      setIsEditingNotes(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveClinicalNotes = () => {
    if (!selectedPatient) return;
    
    updatePatientMutation.mutate({
      id: selectedPatient.id,
      firstName: selectedPatient.firstName,
      lastName: selectedPatient.lastName,
      email: selectedPatient.email || "",
      phone: selectedPatient.phone || "",
      rut: selectedPatient.rut || "",
      birthDate: selectedPatient.birthDate ? new Date(selectedPatient.birthDate) : undefined,
      notes: clinicalNotes,
      status: selectedPatient.status as any,
    }, {
      onSuccess: () => {
        setIsEditingNotes(false);
      }
    });
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("¿Estás segura de que deseas eliminar este paciente? Esta acción borrará de forma permanente su ficha clínica e historial de citas.")) {
      deletePatientMutation.mutate({ id });
    }
  };

  const filteredPatients = patientsList;

  return (
    <div className="space-y-6">
      {/* Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl text-teal">Directorio de Pacientes</h1>
          <p className="font-body text-sm text-teal/70 mt-1">
            Gestiona los perfiles clínicos, fichas técnicas e historial de atenciones de tus pacientes.
          </p>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white hover:bg-teal/90 text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-md self-start sm:self-auto"
        >
          <Plus size={14} /> Registrar Paciente
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-cream/30 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal/30 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, RUT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-offwhite border border-cream rounded-xl font-body text-xs text-teal focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors placeholder:text-teal/30"
          />
        </div>
      </div>

      {/* Table Container (Desktop Only) */}
      <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body text-teal">
            <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">RUT</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Última Visita</th>
                <th className="px-6 py-4 text-right">Ficha Clínica / Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/10">
              {patientsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-teal/40 font-medium">
                    <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando pacientes...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-teal/50 font-medium">
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const lastVisitDate = patient.appointments && patient.appointments[0]
                    ? new Date(patient.appointments[0].date)
                    : null;
                  return (
                    <tr key={patient.id} className="hover:bg-offwhite/30 transition-colors">
                      <td className="px-6 py-4 font-subtitle font-bold text-teal">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {patient.email && <span className="flex items-center gap-1 text-[10px] text-teal/70"><Mail size={10} /> {patient.email}</span>}
                          {patient.phone && <span className="flex items-center gap-1 text-[10px] text-teal/60"><Phone size={10} /> {patient.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal/80">{patient.rut || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider ${
                          patient.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                        }`}>
                          {patient.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold block">{lastVisitDate ? lastVisitDate.toLocaleDateString("es-CL") : "Nunca"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewClinicalFile(patient)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f3ef] hover:bg-cream/30 text-teal text-[10px] font-subtitle uppercase tracking-widest font-bold rounded-xl transition"
                          >
                            <FileText size={13} className="text-terracotta" /> Ficha
                          </button>
                          <button
                            onClick={() => handleEditProfileClick(patient)}
                            className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition"
                            title="Editar Perfil"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(patient.id)}
                            className="p-2 text-redbrown/60 hover:text-redbrown hover:bg-redbrown/5 rounded-xl transition"
                            title="Eliminar Paciente"
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

      {/* Mobile Card List (Mobile Only) */}
      <div className="md:hidden space-y-4">
        {patientsLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium shadow-xs">
            <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
            Cargando pacientes...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium shadow-xs">
            No se encontraron pacientes registrados.
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const lastVisitDate = patient.appointments && patient.appointments[0]
              ? new Date(patient.appointments[0].date)
              : null;
            return (
              <div key={patient.id} className="bg-white p-5 rounded-3xl border border-cream/30 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-subtitle font-bold text-teal text-sm">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    {patient.rut && <p className="text-[11px] text-teal/60 font-semibold mt-0.5">RUT: {patient.rut}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider ${
                    patient.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                  }`}>
                    {patient.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-cream/10 text-xs">
                  {patient.email && (
                    <div className="flex items-center gap-2 text-teal/70">
                      <Mail size={12} className="text-terracotta/75" />
                      <span className="truncate max-w-[200px]">{patient.email}</span>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-teal/70">
                      <Phone size={12} className="text-terracotta/75" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-teal/70">
                    <Calendar size={12} className="text-terracotta/75" />
                    <span>Última visita: {lastVisitDate ? lastVisitDate.toLocaleDateString("es-CL") : "Nunca"}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleViewClinicalFile(patient)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#f7f3ef] hover:bg-cream/30 text-teal text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition"
                  >
                    <FileText size={14} className="text-terracotta" /> Ficha
                  </button>
                  <button
                    onClick={() => handleEditProfileClick(patient)}
                    className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition border border-cream/20"
                    title="Editar Perfil"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(patient.id)}
                    className="p-2 text-redbrown/60 hover:text-redbrown hover:bg-redbrown/5 rounded-xl transition border border-cream/20"
                    title="Eliminar Paciente"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-cream/30 pt-4 bg-white p-4 rounded-3xl border border-cream/10 shadow-xs">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-offwhite hover:bg-cream/10 border border-cream text-teal rounded-xl text-xs font-subtitle uppercase tracking-widest font-bold disabled:opacity-50 transition"
          >
            Anterior
          </button>
          <span className="text-xs font-body text-teal/70 font-semibold">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-offwhite hover:bg-cream/10 border border-cream text-teal rounded-xl text-xs font-subtitle uppercase tracking-widest font-bold disabled:opacity-50 transition"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-title text-xl text-teal font-bold">Registrar Nuevo Paciente</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={addFirstName}
                    onChange={(e) => setAddFirstName(e.target.value)}
                    placeholder="Ej: Camila"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={addLastName}
                    onChange={(e) => setAddLastName(e.target.value)}
                    placeholder="Ej: Ortiz"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">RUT</label>
                  <input
                    type="text"
                    value={addRut}
                    onChange={(e) => setAddRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">F. Nacimiento</label>
                  <input
                    type="date"
                    value={addBirthDate}
                    onChange={(e) => setAddBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Teléfono</label>
                <input
                  type="tel"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Correo Electrónico</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Notas / Observaciones Iniciales</label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Antecedentes médicos relevantes, cirugías previas, uroginecología..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createPatientMutation.isPending}
                  className="flex-1 py-3.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
                >
                  {createPatientMutation.isPending ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Profile Modal */}
      {isEditProfileModalOpen && editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-title text-xl text-teal font-bold">Editar Perfil de Paciente</h3>
              <button onClick={() => setIsEditProfileModalOpen(false)} className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditProfileSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">RUT</label>
                  <input
                    type="text"
                    value={editRut}
                    onChange={(e) => setEditRut(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">F. Nacimiento</label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Teléfono</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">Estado del Paciente</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="flex-1 py-3.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatePatientMutation.isPending}
                  className="flex-1 py-3.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
                >
                  {updatePatientMutation.isPending ? "Guardando..." : "Guardar Perfil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical File & History Modal */}
      {isClinicalModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-4xl rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-terracotta" size={22} />
                <div>
                  <h3 className="font-title text-xl text-teal font-bold">Ficha Clínica: {selectedPatient.firstName} {selectedPatient.lastName}</h3>
                  {selectedPatient.rut && <p className="font-body text-[10px] text-teal/60">RUT: {selectedPatient.rut}</p>}
                </div>
              </div>
              <button onClick={() => setIsClinicalModalOpen(false)} className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50">
                <X size={18} />
              </button>
            </div>

            {/* Split Screen layout */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Panel: Clinical Notes */}
              <div className="flex-1 p-6 flex flex-col border-b md:border-b-0 md:border-r border-cream/30 overflow-y-auto bg-white">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h4 className="font-subtitle text-xs uppercase tracking-wider font-bold text-teal">Antecedentes Clínicos y Notas</h4>
                  
                  {!isEditingNotes ? (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="px-3 py-1 bg-[#f7f3ef] text-teal hover:bg-cream/30 text-[10px] font-subtitle uppercase tracking-widest font-bold rounded-xl transition"
                    >
                      Editar Notas
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setClinicalNotes(selectedPatient.notes || "");
                          setIsEditingNotes(false);
                        }}
                        className="px-3 py-1 border border-cream hover:bg-offwhite text-[10px] font-subtitle uppercase tracking-widest font-bold rounded-xl transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveClinicalNotes}
                        disabled={updatePatientMutation.isPending}
                        className="px-3 py-1 bg-teal text-white hover:bg-teal/90 text-[10px] font-subtitle uppercase tracking-widest font-bold rounded-xl transition"
                      >
                        {updatePatientMutation.isPending ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  {isEditingNotes ? (
                    <textarea
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Escribe el historial clínico, notas de uroginecología, postparto, evolución, síntomas..."
                      className="w-full flex-1 p-4 bg-offwhite/50 border border-cream rounded-2xl font-body text-sm text-teal focus:outline-none focus:border-terracotta resize-none min-h-[250px]"
                    />
                  ) : (
                    <div className="flex-1 p-4 bg-offwhite/30 rounded-2xl border border-cream/20 font-body text-sm text-teal/80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {selectedPatient.notes || "No hay notas clínicas registradas para este paciente."}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Appointments History */}
              <div className="w-full md:w-80 bg-offwhite/40 p-6 overflow-y-auto flex flex-col">
                <h4 className="font-subtitle text-xs uppercase tracking-wider font-bold text-teal mb-4 flex-shrink-0">Historial de Citas</h4>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {!selectedPatient.appointments || selectedPatient.appointments.length === 0 ? (
                    <div className="text-center p-6 bg-white/50 rounded-2xl border border-dashed border-cream">
                      <Calendar size={24} className="text-teal/30 mx-auto mb-1" />
                      <p className="font-body text-[11px] text-teal/60">No tiene citas previas</p>
                    </div>
                  ) : (
                    selectedPatient.appointments.map((appt: Appointment) => {
                      const d = new Date(appt.date);
                      return (
                        <div key={appt.id} className="p-3 bg-white border border-cream/20 rounded-xl shadow-xs">
                          <p className="font-subtitle text-[11px] font-bold text-teal">{appt.title}</p>
                          <p className="font-body text-[10px] text-teal/60 mt-0.5">
                            {d.toLocaleDateString("es-CL")} a las {d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-subtitle font-bold uppercase tracking-wider ${
                              appt.status === "ATTENDED" || appt.status === "TRANSFERRED"
                                ? "bg-emerald-50 text-emerald-700" 
                                : appt.status === "CANCELLED" 
                                ? "bg-redbrown/10 text-redbrown"
                                : "bg-blue-50 text-blue-700"
                            }`}>
                              {appt.status === "ATTENDED" 
                                ? "Asistió" 
                                : appt.status === "TRANSFERRED" 
                                ? "Transferido"
                                : appt.status === "CANCELLED"
                                ? "Cancelada"
                                : "Reservada"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
