"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Tag,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { ConfirmModal } from "~/components/admin/ConfirmModal";

export default function AdminBlogCategoriesPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // Para edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditingName] = useState("");
  const [editSlug, setEditingSlug] = useState("");
  const [editSlugEdited, setEditingSlugEdited] = useState(false);

  // Para eliminación
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const utils = api.useUtils();

  // Queries & Mutations
  const { data: categories, isLoading } = api.blog.getCategories.useQuery();

  const createMutation = api.blog.createCategory.useMutation({
    onSuccess: () => {
      void utils.blog.getCategories.invalidate();
      setName("");
      setSlug("");
      setSlugEdited(false);
    },
  });

  const updateMutation = api.blog.updateCategory.useMutation({
    onSuccess: () => {
      void utils.blog.getCategories.invalidate();
      setEditingId(null);
      setEditingName("");
      setEditingSlug("");
      setEditingSlugEdited(false);
    },
  });

  const deleteMutation = api.blog.deleteCategory.useMutation({
    onSuccess: () => {
      void utils.blog.getCategories.invalidate();
      setDeleteId(null);
    },
  });

  // Slug generator helpers
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  };

  const handleEditNameChange = (val: string) => {
    setEditingName(val);
    if (!editSlugEdited) {
      setEditingSlug(slugify(val));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate({
      id: editingId,
      name: editName.trim(),
      slug: editSlug.trim() || slugify(editName),
    });
  };

  const startEdit = (cat: { id: string; name: string; slug: string }) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingSlug(cat.slug);
    setEditingSlugEdited(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingSlug("");
    setEditingSlugEdited(false);
  };

  const categoryToDelete = categories?.find((c) => c.id === deleteId);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/blog"
          className="p-2 rounded-xl text-teal/60 hover:bg-cream/60 hover:text-teal transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-title text-2xl text-teal">Categorías</h1>
          <p className="font-body text-sm text-teal/60">
            Administra las categorías de las publicaciones
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario de creación u edición */}
        <div className="md:col-span-1 space-y-6">
          {editingId ? (
            // Edit Form
            <form
              onSubmit={handleUpdateSubmit}
              className="bg-white border border-cream/40 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-cream/20 pb-2 mb-2">
                <h2 className="font-subtitle font-bold text-teal text-xs uppercase tracking-wider">
                  Editar Categoría
                </h2>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-teal/40 hover:text-teal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-teal/50 font-subtitle tracking-wider block">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => handleEditNameChange(e.target.value)}
                  placeholder="Ej: Consejos de Maternidad"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-cream/60 font-body text-sm text-teal bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-teal/50 font-subtitle tracking-wider block">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => {
                    setEditingSlug(e.target.value);
                    setEditingSlugEdited(true);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-cream/60 font-body text-xs text-teal/70 bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors"
                />
              </div>

              {updateMutation.error && (
                <p className="text-red-500 text-xs font-body">
                  {updateMutation.error.message}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 px-3 py-2 rounded-xl border border-cream/60 font-subtitle text-[11px] font-bold text-teal/70 hover:bg-offwhite transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#0f3f3e] text-white font-subtitle text-[11px] font-bold uppercase tracking-wider hover:bg-[#1a5a58] transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            // Create Form
            <form
              onSubmit={handleCreateSubmit}
              className="bg-white border border-cream/40 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <h2 className="font-subtitle font-bold text-teal text-xs uppercase tracking-wider border-b border-cream/20 pb-2 mb-2">
                Nueva Categoría
              </h2>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-teal/50 font-subtitle tracking-wider block">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Consejos"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-cream/60 font-body text-sm text-teal bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-teal/50 font-subtitle tracking-wider block">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEdited(true);
                  }}
                  required
                  placeholder="auto-generado"
                  className="w-full px-3 py-2 rounded-xl border border-cream/60 font-body text-xs text-teal/70 bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors"
                />
              </div>

              {createMutation.error && (
                <p className="text-red-500 text-xs font-body">
                  {createMutation.error.message}
                </p>
              )}

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full flex items-center justify-center gap-1 px-4 py-2.5 bg-[#c48a6a] text-white rounded-xl font-subtitle text-[11px] font-bold uppercase tracking-wider hover:bg-[#b07a5a] transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Plus size={12} />
                )}
                Crear Categoría
              </button>
            </form>
          )}
        </div>

        {/* Lista de categorías */}
        <div className="md:col-span-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-cream/30 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-12 bg-white border border-cream/40 rounded-2xl text-teal/40 font-body">
              <Tag size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aún no hay categorías registradas.</p>
            </div>
          ) : (
            <div className="bg-white border border-cream/40 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-cream/20">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 flex items-center justify-between hover:bg-offwhite/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <h3 className="font-subtitle font-bold text-teal text-sm">
                        {cat.name}
                      </h3>
                      <p className="font-body text-[11px] text-teal/40 truncate">
                        /{cat.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(cat)}
                        className={`p-2 rounded-xl text-teal/60 hover:bg-cream/40 hover:text-teal transition-colors ${
                          editingId === cat.id ? "bg-cream/40 text-teal" : ""
                        }`}
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteId !== null}
        title="¿Eliminar categoría?"
        description={`Se eliminará permanentemente la categoría "${categoryToDelete?.name ?? ""}". Los artículos que estén en esta categoría quedarán sin categoría (desasociados). Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate({ id: deleteId });
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
