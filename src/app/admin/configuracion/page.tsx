"use client";

import { useState } from "react";
import { KeyRound, CheckCircle2, AlertCircle, Link as LinkIcon, Users, Plus, Trash2, Calendar, Phone, Mail, MapPin, Globe } from "lucide-react";
import { updatePasswordAction } from "./actions";
import { api } from "~/trpc/react";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RRSS/Contacto config
  const utils = api.useUtils();
  const { data: siteConfigs, isLoading: isLoadingConfigs } = api.siteConfig.get.useQuery({
    keys: ["whatsapp_number", "instagram_url", "facebook_url", "email_address", "address"]
  });
  const updateConfigs = api.siteConfig.setMany.useMutation({
    onSuccess: () => {
      utils.siteConfig.get.invalidate();
      alert("Configuración actualizada correctamente");
    }
  });

  const handleUpdateConfigs = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const configs = [
      { key: "whatsapp_number", value: formData.get("whatsapp_number") as string },
      { key: "instagram_url", value: formData.get("instagram_url") as string },
      { key: "facebook_url", value: formData.get("facebook_url") as string },
      { key: "email_address", value: formData.get("email_address") as string },
      { key: "address", value: formData.get("address") as string },
    ];
    updateConfigs.mutate({ configs });
  };

  // Usuarios Admin
  const { data: me } = api.admin.me.useQuery();
  const isAdmin = me?.email === "admin@estudiopelvico.cl" || me?.email === "Estudiopelvico.co@gmail.com";
  
  const { data: admins, isLoading: isLoadingAdmins } = api.admin.getAll.useQuery(undefined, {
    enabled: isAdmin,
  });
  const createAdmin = api.admin.create.useMutation({
    onSuccess: () => {
      utils.admin.getAll.invalidate();
      setNewAdminForm({ name: "", email: "", password: "" });
    },
    onError: (err) => alert(err.message)
  });
  const deleteAdmin = api.admin.delete.useMutation({
    onSuccess: () => utils.admin.getAll.invalidate(),
    onError: (err) => alert(err.message)
  });

  const [newAdminForm, setNewAdminForm] = useState({ name: "", email: "", password: "" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updatePasswordAction(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-subtitle font-bold text-[#0f3f3e]">
          Configuración
        </h1>
        <p className="text-teal/70 mt-1">
          Administra la configuración de tu cuenta y la seguridad.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-cream/40 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <KeyRound size={120} />
        </div>

        <h2 className="text-lg font-bold text-[#0f3f3e] mb-4 flex items-center gap-2">
          <KeyRound size={20} className="text-[#c48a6a]" />
          Cambiar Contraseña
        </h2>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-start gap-3">
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">Contraseña actualizada exitosamente. Tu nueva contraseña ya está activa.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-teal block" htmlFor="currentPassword">
              Contraseña Actual
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-cream bg-[#f7f3ef]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a6a]/30 focus:border-[#c48a6a] transition-all text-teal"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-teal block" htmlFor="newPassword">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-cream bg-[#f7f3ef]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a6a]/30 focus:border-[#c48a6a] transition-all text-teal"
              placeholder="Min. 6 caracteres"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-teal block" htmlFor="confirmPassword">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-cream bg-[#f7f3ef]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c48a6a]/30 focus:border-[#c48a6a] transition-all text-teal"
              placeholder="Vuelve a escribir la nueva contraseña"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0f3f3e] hover:bg-[#0f3f3e]/90 text-white rounded-xl font-subtitle font-bold text-sm tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Contraseña"
              )}
            </button>
          </div>
        </form>
      </div>



      {isAdmin && (
        <div className="bg-white rounded-2xl p-6 border border-cream/40 shadow-sm relative overflow-hidden">
          <h2 className="text-lg font-bold text-[#0f3f3e] mb-4 flex items-center gap-2">
            <Users size={20} className="text-[#c48a6a]" />
            Administradores
          </h2>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            createAdmin.mutate(newAdminForm);
          }} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-3 flex-wrap">
          <input
            type="text"
            required
            placeholder="Nombre"
            value={newAdminForm.name}
            onChange={e => setNewAdminForm(f => ({ ...f, name: e.target.value }))}
            className="flex-1 px-4 py-2 rounded-xl border border-cream focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-sm"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={newAdminForm.email}
            onChange={e => setNewAdminForm(f => ({ ...f, email: e.target.value }))}
            className="flex-1 px-4 py-2 rounded-xl border border-cream focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={newAdminForm.password}
            onChange={e => setNewAdminForm(f => ({ ...f, password: e.target.value }))}
            className="flex-1 px-4 py-2 rounded-xl border border-cream focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-sm"
          />
          <button type="submit" disabled={createAdmin.isPending} className="bg-terracotta hover:bg-terracotta/90 text-white p-2 rounded-xl transition-colors">
            <Plus size={20} />
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 rounded-r-xl">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins?.map((admin) => (
                <tr key={admin.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{admin.name || "Sin nombre"}</td>
                  <td className="px-4 py-3">{admin.email}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar usuario ${admin.email}?`)) {
                          deleteAdmin.mutate({ id: admin.id });
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar administrador"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {admins?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No hay otros administradores</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
