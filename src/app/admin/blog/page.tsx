"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ConfirmModal } from "~/components/admin/ConfirmModal";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminBlogPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtros y paginación
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const utils = api.useUtils();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: categories } = api.blog.getCategories.useQuery();

  const { data, isLoading } = api.blog.getAllAdmin.useQuery(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      categoryId: categoryId || undefined,
    },
    {
      placeholderData: (prev) => prev,
    },
  );

  const posts = data?.posts;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const deleteMutation = api.blog.delete.useMutation({
    onSuccess: () => {
      void utils.blog.getAllAdmin.invalidate();
      setDeleteId(null);
    },
  });

  const postToDelete = posts?.find((p) => p.id === deleteId);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f3f3e]/10 flex items-center justify-center">
            <BookOpen size={20} className="text-[#0f3f3e]" />
          </div>
          <div>
            <h1 className="font-title text-2xl text-teal">Blog</h1>
            <p className="font-body text-sm text-teal/60">
              Gestión de publicaciones
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blog/categorias"
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#c48a6a] text-[#c48a6a] rounded-xl font-subtitle text-xs font-bold uppercase tracking-wider hover:bg-cream/10 transition-colors"
          >
            Categorías
          </Link>
          <Link
            href="/admin/blog/nuevo"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#c48a6a] text-white rounded-xl font-subtitle text-xs font-bold uppercase tracking-wider hover:bg-[#b07a5a] transition-colors"
          >
            <Plus size={16} />
            Nuevo post
          </Link>
        </div>
      </div>

      {/* Caja de Filtros */}
      <div className="bg-white border border-cream/40 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/40"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar post por título o descripción..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream/50 bg-offwhite/30 font-body text-sm text-teal placeholder-teal/40 focus:outline-none focus:border-[#0f3f3e] transition-colors"
          />
        </div>
        {/* Category Dropdown */}
        <div className="w-full md:w-64">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-cream/50 bg-offwhite/30 font-body text-sm text-teal focus:outline-none focus:border-[#0f3f3e] transition-colors"
          >
            <option value="">Todas las categorías</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-cream/40 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-cream/40 rounded-2xl text-teal/40 font-body shadow-sm">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aún no hay posts que cumplan con la búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 bg-white border border-cream/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Imagen */}
              {post.mainImage ? (
                <img
                  src={post.mainImage}
                  alt={post.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-cream/60 flex items-center justify-center shrink-0">
                  <BookOpen size={24} className="text-teal/30" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-subtitle uppercase tracking-wider ${
                      post.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {post.status === "PUBLISHED" ? (
                      <Eye size={10} />
                    ) : (
                      <EyeOff size={10} />
                    )}
                    {post.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                  </span>
                  {post.category && (
                    <span className="text-[10px] text-teal/50 font-subtitle uppercase tracking-wider">
                      {post.category.name}
                    </span>
                  )}
                </div>
                <h2 className="font-subtitle font-bold text-teal text-sm truncate">
                  {post.title}
                </h2>
                <p className="font-body text-xs text-teal/50 truncate">
                  {post.description}
                </p>
                <p className="font-body text-[10px] text-teal/40 mt-1">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Previsualizar */}
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="p-2 rounded-xl text-teal/60 hover:bg-cream/40 hover:text-teal transition-colors"
                  title="Ver / Previsualizar post"
                >
                  <ExternalLink size={16} />
                </Link>
                <Link
                  href={`/admin/blog/${post.id}/editar`}
                  className="p-2 rounded-xl text-teal/60 hover:bg-cream/40 hover:text-teal transition-colors"
                  title="Editar"
                >
                  <Edit3 size={16} />
                </Link>
                <button
                  onClick={() => setDeleteId(post.id)}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-cream/20 pt-4 mt-6">
              <span className="text-xs text-teal/60 font-body">
                Mostrando {posts.length} de {totalCount} publicaciones
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-2 border border-cream/60 rounded-xl hover:bg-white text-teal/60 hover:text-teal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 font-subtitle text-xs font-bold text-teal">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 border border-cream/60 rounded-xl hover:bg-white text-teal/60 hover:text-teal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="¿Eliminar post?"
        description={`Se eliminará permanentemente "${postToDelete?.title ?? ""}" de la base de datos y su archivo de imagen en Cloudinary. Esta acción no se puede deshacer.`}
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
