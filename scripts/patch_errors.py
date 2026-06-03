import os

path = "src/app/admin/pacientes/page.tsx"
with open(path, "r") as f:
    content = f.read()

# Replace addError -> addErrors
content = content.replace('const [addError, setAddError] = useState("");', 'const [addErrors, setAddErrors] = useState<Record<string, string>>({});')
content = content.replace('const [editError, setEditError] = useState("");', 'const [editErrors, setEditErrors] = useState<Record<string, string>>({});')

# Replace getErrorMessage -> parseErrors and mutation handlers
old_mutation_block = """  const getErrorMessage = (err: any) => {
    try {
      const parsed = JSON.parse(err.message);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((e: any) => e.message).join(", ");
      }
    } catch (e) {}
    return err.message;
  };

  const createPatientMutation = api.patient.create.useMutation({
    onSuccess: async () => {
      await utils.patient.getAll.invalidate();
      setIsAddModalOpen(false);
      resetAddForm();
      setAddError("");
    },
    onError: (err) => {
      setAddError(getErrorMessage(err));
    }
  });

  const updatePatientMutation = api.patient.update.useMutation({
    onSuccess: async () => {
      await utils.patient.getAll.invalidate();
      setIsEditProfileModalOpen(false);
      setEditError("");
      if (editingPatient && selectedPatient?.id === editingPatient.id) {
        // Update selected patient cache if open
        const updated = await utils.patient.getById.fetch({ id: editingPatient.id });
        setSelectedPatient(updated as SelectedPatient);
      }
    },
    onError: (err) => {
      setEditError(getErrorMessage(err));
      // For clinical notes editing
      if (isEditingNotes) {
        alert(getErrorMessage(err));
      }
    }
  });"""

new_mutation_block = """  const parseErrors = (err: any) => {
    try {
      const parsed = JSON.parse(err.message);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const errors: Record<string, string> = {};
        parsed.forEach((e: any) => {
          if (e.path && e.path.length > 0) {
            errors[e.path[0]] = e.message;
          }
        });
        return errors;
      }
    } catch (e) {}
    return { global: err.message };
  };

  const createPatientMutation = api.patient.create.useMutation({
    onSuccess: async () => {
      await utils.patient.getAll.invalidate();
      setIsAddModalOpen(false);
      resetAddForm();
      setAddErrors({});
    },
    onError: (err) => {
      setAddErrors(parseErrors(err));
    }
  });

  const updatePatientMutation = api.patient.update.useMutation({
    onSuccess: async () => {
      await utils.patient.getAll.invalidate();
      setIsEditProfileModalOpen(false);
      setEditErrors({});
      if (editingPatient && selectedPatient?.id === editingPatient.id) {
        // Update selected patient cache if open
        const updated = await utils.patient.getById.fetch({ id: editingPatient.id });
        setSelectedPatient(updated as SelectedPatient);
      }
    },
    onError: (err) => {
      const errors = parseErrors(err);
      setEditErrors(errors);
      // For clinical notes editing
      if (isEditingNotes) {
        alert(errors.global || "Ocurrió un error al guardar las notas.");
      }
    }
  });"""

content = content.replace(old_mutation_block, new_mutation_block)

content = content.replace('setAddError("");', 'setAddErrors({});')
content = content.replace('setEditError("");', 'setEditErrors({});')

# Add form inputs replacement
# firstName
content = content.replace(
'''                  <input
                    type="text"
                    required
                    value={addFirstName}
                    onChange={(e) => setAddFirstName(e.target.value)}
                    placeholder="Ej: Camila"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="text"
                    required
                    value={addFirstName}
                    onChange={(e) => { setAddFirstName(e.target.value); setAddErrors(prev => ({...prev, firstName: ""})); }}
                    placeholder="Ej: Camila"
                    className={`w-full px-4 py-3 bg-white border ${addErrors.firstName ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {addErrors.firstName && <p className="text-redbrown text-[10px] font-semibold mt-1">{addErrors.firstName}</p>}'''
)

# lastName
content = content.replace(
'''                  <input
                    type="text"
                    required
                    value={addLastName}
                    onChange={(e) => setAddLastName(e.target.value)}
                    placeholder="Ej: Ortiz"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="text"
                    required
                    value={addLastName}
                    onChange={(e) => { setAddLastName(e.target.value); setAddErrors(prev => ({...prev, lastName: ""})); }}
                    placeholder="Ej: Ortiz"
                    className={`w-full px-4 py-3 bg-white border ${addErrors.lastName ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {addErrors.lastName && <p className="text-redbrown text-[10px] font-semibold mt-1">{addErrors.lastName}</p>}'''
)

# rut
content = content.replace(
'''                  <input
                    type="text"
                    value={addRut}
                    onChange={(e) => setAddRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="text"
                    value={addRut}
                    onChange={(e) => { setAddRut(e.target.value); setAddErrors(prev => ({...prev, rut: ""})); }}
                    placeholder="12.345.678-9"
                    className={`w-full px-4 py-3 bg-white border ${addErrors.rut ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {addErrors.rut && <p className="text-redbrown text-[10px] font-semibold mt-1">{addErrors.rut}</p>}'''
)

# birthDate
content = content.replace(
'''                  <input
                    type="date"
                    value={addBirthDate}
                    onChange={(e) => setAddBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="date"
                    value={addBirthDate}
                    onChange={(e) => { setAddBirthDate(e.target.value); setAddErrors(prev => ({...prev, birthDate: ""})); }}
                    className={`w-full px-4 py-3 bg-white border ${addErrors.birthDate ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {addErrors.birthDate && <p className="text-redbrown text-[10px] font-semibold mt-1">{addErrors.birthDate}</p>}'''
)

# phone
content = content.replace(
'''                <input
                  type="tel"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />''',
'''                <input
                  type="tel"
                  value={addPhone}
                  onChange={(e) => { setAddPhone(e.target.value); setAddErrors(prev => ({...prev, phone: ""})); }}
                  placeholder="+56 9 1234 5678"
                  className={`w-full px-4 py-3 bg-white border ${addErrors.phone ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                />
                {addErrors.phone && <p className="text-redbrown text-[10px] font-semibold mt-1">{addErrors.phone}</p>}'''
)

# email
content = content.replace(
'''                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />''',
'''                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => { setAddEmail(e.target.value); setAddErrors(prev => ({...prev, email: ""})); }}
                  placeholder="correo@ejemplo.com"
                  className={`w-full px-4 py-3 bg-white border ${addErrors.email ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                />
                {addErrors.email && <p className="text-redbrown text-[10px] font-semibold mt-1">{addErrors.email}</p>}'''
)

# notes
content = content.replace(
'''                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Antecedentes médicos relevantes, cirugías previas, uroginecología..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta resize-none"
                />''',
'''                <textarea
                  value={addNotes}
                  onChange={(e) => { setAddNotes(e.target.value); setAddErrors(prev => ({...prev, notes: ""})); }}
                  placeholder="Antecedentes médicos relevantes, cirugías previas, uroginecología..."
                  rows={3}
                  className={`w-full px-4 py-3 bg-white border ${addErrors.notes ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta resize-none`}
                />
                {addErrors.notes && <p className="text-redbrown text-[10px] font-semibold mt-1">{addErrors.notes}</p>}'''
)

# global add error
content = content.replace(
'''              {addError && (
                <div className="p-3 bg-redbrown/10 border border-redbrown/20 rounded-xl text-redbrown text-xs font-semibold">
                  {addError}
                </div>
              )}''',
'''              {addErrors.global && (
                <div className="p-3 bg-redbrown/10 border border-redbrown/20 rounded-xl text-redbrown text-xs font-semibold">
                  {addErrors.global}
                </div>
              )}'''
)

# edit firstName
content = content.replace(
'''                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => { setEditFirstName(e.target.value); setEditErrors(prev => ({...prev, firstName: ""})); }}
                    className={`w-full px-4 py-3 bg-white border ${editErrors.firstName ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {editErrors.firstName && <p className="text-redbrown text-[10px] font-semibold mt-1">{editErrors.firstName}</p>}'''
)

# edit lastName
content = content.replace(
'''                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => { setEditLastName(e.target.value); setEditErrors(prev => ({...prev, lastName: ""})); }}
                    className={`w-full px-4 py-3 bg-white border ${editErrors.lastName ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {editErrors.lastName && <p className="text-redbrown text-[10px] font-semibold mt-1">{editErrors.lastName}</p>}'''
)

# edit rut
content = content.replace(
'''                  <input
                    type="text"
                    value={editRut}
                    onChange={(e) => setEditRut(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="text"
                    value={editRut}
                    onChange={(e) => { setEditRut(e.target.value); setEditErrors(prev => ({...prev, rut: ""})); }}
                    className={`w-full px-4 py-3 bg-white border ${editErrors.rut ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {editErrors.rut && <p className="text-redbrown text-[10px] font-semibold mt-1">{editErrors.rut}</p>}'''
)

# edit birthDate
content = content.replace(
'''                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                  />''',
'''                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => { setEditBirthDate(e.target.value); setEditErrors(prev => ({...prev, birthDate: ""})); }}
                    className={`w-full px-4 py-3 bg-white border ${editErrors.birthDate ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                  />
                  {editErrors.birthDate && <p className="text-redbrown text-[10px] font-semibold mt-1">{editErrors.birthDate}</p>}'''
)

# edit phone
content = content.replace(
'''                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />''',
'''                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => { setEditPhone(e.target.value); setEditErrors(prev => ({...prev, phone: ""})); }}
                  className={`w-full px-4 py-3 bg-white border ${editErrors.phone ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                />
                {editErrors.phone && <p className="text-redbrown text-[10px] font-semibold mt-1">{editErrors.phone}</p>}'''
)

# edit email
content = content.replace(
'''                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                />''',
'''                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => { setEditEmail(e.target.value); setEditErrors(prev => ({...prev, email: ""})); }}
                  className={`w-full px-4 py-3 bg-white border ${editErrors.email ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                />
                {editErrors.email && <p className="text-redbrown text-[10px] font-semibold mt-1">{editErrors.email}</p>}'''
)

# edit status
content = content.replace(
'''                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta"
                >''',
'''                <select
                  value={editStatus}
                  onChange={(e) => { setEditStatus(e.target.value as any); setEditErrors(prev => ({...prev, status: ""})); }}
                  className={`w-full px-4 py-3 bg-white border ${editErrors.status ? 'border-redbrown/50 bg-redbrown/5' : 'border-cream'} rounded-xl font-body text-sm text-teal focus:outline-none focus:border-terracotta`}
                >'''
)
content = content.replace(
'''                </select>
              </div>

              {editError && (''',
'''                </select>
                {editErrors.status && <p className="text-redbrown text-[10px] font-semibold mt-1">{editErrors.status}</p>}
              </div>

              {editErrors.global && ('''
)

# global edit error
content = content.replace(
'''              {editError && (
                <div className="p-3 bg-redbrown/10 border border-redbrown/20 rounded-xl text-redbrown text-xs font-semibold">
                  {editError}
                </div>
              )}''',
'''              {editErrors.global && (
                <div className="p-3 bg-redbrown/10 border border-redbrown/20 rounded-xl text-redbrown text-xs font-semibold">
                  {editErrors.global}
                </div>
              )}'''
)

with open(path, "w") as f:
    f.write(content)
print("done")
