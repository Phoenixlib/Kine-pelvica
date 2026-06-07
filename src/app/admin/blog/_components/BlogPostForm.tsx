"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { BlogEditor } from "~/components/admin/BlogEditor";
import { useCloudinaryUpload } from "~/hooks/useCloudinaryUpload";
import { ImagePlus, Loader2, Save, Eye, EyeOff, X } from "lucide-react";

interface BlogPostFormProps {
  mode: "create" | "edit";
  postId?: string;
  initialData?: {
    title: string;
    slug: string;
    description: string;
    body: Record<string, unknown>;
    mainImage: string | null;
    status: "DRAFT" | "PUBLISHED";
    categoryId: string | null;
  };
}

export function BlogPostForm({ mode, postId, initialData }: BlogPostFormProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: categories } = api.blog.getCategories.useQuery();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [body, setBody] = useState<Record<string, unknown>>(
    initialData?.body ?? {},
  );
  const [mainImage, setMainImage] = useState<string | null>(
    initialData?.mainImage ?? null,
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialData?.status ?? "DRAFT",
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId ?? "",
  );
  const [slugEdited, setSlugEdited] = useState(mode === "edit");

  const { uploading, uploadFiles, error: uploadError } = useCloudinaryUpload();

  // Auto-generate slug from title (only in create mode until user edits manually)
  useEffect(() => {
    if (slugEdited || mode === "edit") return;
    const generated = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setSlug(generated);
  }, [title, slugEdited, mode]);

  const createMutation = api.blog.create.useMutation({
    onSuccess: () => {
      void utils.blog.getAllAdmin.invalidate();
      router.push("/admin/blog");
    },
  });

  const updateMutation = api.blog.update.useMutation({
    onSuccess: () => {
      void utils.blog.getAllAdmin.invalidate();
      router.push("/admin/blog");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const results = await uploadFiles(files);
    if (results[0]) setMainImage(results[0].secureUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      slug: slug || undefined,
      description,
      body,
      mainImage: mainImage ?? null,
      status,
      categoryId: categoryId || null,
      publishedAt: status === "PUBLISHED" ? new Date().toISOString() : null,
    };
    if (mode === "create") {
      createMutation.mutate(payload);
    } else if (postId) {
      updateMutation.mutate({ ...payload, id: postId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status toggle */}
      <div className="flex items-center gap-3 p-4 bg-white border border-cream/40 rounded-2xl">
        <span className="font-subtitle text-xs font-bold text-teal/60 uppercase tracking-wider flex-1">
          Estado del post
        </span>
        <button
          type="button"
          onClick={() => setStatus(status === "DRAFT" ? "PUBLISHED" : "DRAFT")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-subtitle text-xs font-bold transition-all ${
            status === "PUBLISHED"
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          {status === "PUBLISHED" ? <Eye size={14} /> : <EyeOff size={14} />}
          {status === "PUBLISHED" ? "Publicado" : "Borrador"}
        </button>
      </div>

      {/* Imagen principal */}
      <div className="bg-white border border-cream/40 rounded-2xl p-4 space-y-3">
        <label className="font-subtitle text-xs font-bold text-teal/60 uppercase tracking-wider block">
          Imagen principal
        </label>
        {mainImage ? (
          <div className="relative">
            <img
              src={mainImage}
              alt="Imagen del post"
              className="w-full max-h-48 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => setMainImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-cream/60 rounded-xl cursor-pointer hover:bg-cream/10 transition-colors">
            {uploading ? (
              <Loader2 size={24} className="text-teal/40 animate-spin" />
            ) : (
              <>
                <ImagePlus size={24} className="text-teal/30 mb-2" />
                <span className="font-body text-xs text-teal/40">
                  Subir imagen (Cloudinary)
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleImageUpload(e)}
              disabled={uploading}
            />
          </label>
        )}
        {uploadError && (
          <p className="text-red-500 text-xs font-body">{uploadError}</p>
        )}
      </div>

      {/* Título */}
      <div className="bg-white border border-cream/40 rounded-2xl p-4 space-y-2">
        <label className="font-subtitle text-xs font-bold text-teal/60 uppercase tracking-wider block">
          Título *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="El título del post…"
          required
          className="w-full px-4 py-3 rounded-xl border border-cream/60 font-body text-teal bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors"
        />
      </div>

      {/* Slug */}
      <div className="bg-white border border-cream/40 rounded-2xl p-4 space-y-2">
        <label className="font-subtitle text-xs font-bold text-teal/60 uppercase tracking-wider block">
          Slug (URL) *
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          placeholder="mi-titulo-del-post"
          required
          className="w-full px-4 py-3 rounded-xl border border-cream/60 font-body text-sm text-teal/70 bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors"
        />
        <p className="font-body text-[11px] text-teal/40">
          /blog/{slug || "…"}
        </p>
      </div>

      {/* Descripción */}
      <div className="bg-white border border-cream/40 rounded-2xl p-4 space-y-2">
        <label className="font-subtitle text-xs font-bold text-teal/60 uppercase tracking-wider flex items-center justify-between">
          <span>
            Descripción corta *{" "}
            <span className="font-normal normal-case">(max 200 chars)</span>
          </span>
          <span
            className={
              description.length > 190 ? "text-red-500" : "text-teal/40"
            }
          >
            {description.length}/200
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Un resumen para las tarjetas del blog…"
          maxLength={200}
          rows={3}
          required
          className="w-full px-4 py-3 rounded-xl border border-cream/60 font-body text-teal bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors resize-none"
        />
      </div>

      {/* Categoría */}
      <div className="bg-white border border-cream/40 rounded-2xl p-4 space-y-2">
        <label className="font-subtitle text-xs font-bold text-teal/60 uppercase tracking-wider block">
          Categoría
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-cream/60 font-body text-teal bg-offwhite/50 focus:outline-none focus:border-[#0f3f3e] transition-colors"
        >
          <option value="">Sin categoría</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Editor de contenido */}
      <div className="space-y-2">
        <label className="font-subtitle text-xs font-bold text-teal/60 uppercase tracking-wider block px-1">
          Contenido *
        </label>
        <BlogEditor value={body} onChange={setBody} />
      </div>

      {/* Error */}
      {mutationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-body text-sm text-red-700">
            {mutationError.message}
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="flex-1 px-4 py-3 rounded-xl border border-cream/60 font-subtitle text-xs font-bold text-teal/70 hover:bg-offwhite transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0f3f3e] text-white font-subtitle text-xs font-bold uppercase tracking-wider hover:bg-[#1a5a58] transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {mode === "create" ? "Crear post" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
