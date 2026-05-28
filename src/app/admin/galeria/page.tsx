"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useCloudinaryUpload } from "~/hooks/useCloudinaryUpload";
import { 
  Plus, 
  Trash2, 
  X, 
  Image as ImageIcon, 
  UploadCloud, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown
} from "lucide-react";

interface GalleryPhoto {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  caption: string | null;
  order: number;
  isVisible: boolean;
}

export default function GaleriaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);

  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [order, setOrder] = useState(0);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const { uploadFiles, uploading: imageUploading } = useCloudinaryUpload();

  const utils = api.useUtils();
  const { data: photos, isLoading: photosLoading } = api.gallery.getAllAdmin.useQuery();

  const createPhoto = api.gallery.create.useMutation({
    onSuccess: async () => {
      await utils.gallery.getAllAdmin.invalidate();
      setIsModalOpen(false);
      resetForm();
    }
  });

  const updatePhoto = api.gallery.update.useMutation({
    onSuccess: async () => {
      await utils.gallery.getAllAdmin.invalidate();
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deletePhoto = api.gallery.delete.useMutation({
    onSuccess: async () => {
      await utils.gallery.getAllAdmin.invalidate();
    }
  });

  const resetForm = () => {
    setEditingPhoto(null);
    setBeforeUrl("");
    setAfterUrl("");
    setCaption("");
    setOrder(0);
    setSaveStatus("idle");
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const results = await uploadFiles([files[0]!]);
      if (results && results[0]) {
        if (type === "before") {
          setBeforeUrl(results[0].secureUrl);
        } else {
          setAfterUrl(results[0].secureUrl);
        }
      }
    } catch (err) {
      console.error("Failed to upload gallery photo:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeUrl || !afterUrl) {
      setSaveStatus("error");
      setSaveError("Debes subir ambas fotos (Antes y Después).");
      return;
    }

    setSaveStatus("saving");

    if (editingPhoto) {
      updatePhoto.mutate({
        id: editingPhoto.id,
        beforeUrl,
        afterUrl,
        caption: caption || null,
        order,
        isVisible: editingPhoto.isVisible,
      });
    } else {
      createPhoto.mutate({
        beforeUrl,
        afterUrl,
        caption: caption || null,
        order,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás segura de que deseas eliminar este par de imágenes? Se borrarán permanentemente de Cloudinary.")) {
      deletePhoto.mutate({ id });
    }
  };

  const toggleVisibility = (photo: GalleryPhoto) => {
    updatePhoto.mutate({
      id: photo.id,
      beforeUrl: photo.beforeUrl,
      afterUrl: photo.afterUrl,
      caption: photo.caption,
      order: photo.order,
      isVisible: !photo.isVisible,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl text-teal">Galería Antes y Después</h1>
          <p className="font-body text-sm text-teal/70 mt-1">
            Muestra resultados reales de tus tratamientos clínicos con comparaciones de fotos interactivas.
          </p>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white hover:bg-teal/90 text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-md self-start"
        >
          <Plus size={14} /> Nueva Comparación
        </button>
      </div>

      {photosLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
          <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
          Cargando galería...
        </div>
      ) : photos?.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium">
          No hay imágenes registradas en la galería. Haz clic en "Nueva Comparación" para empezar.
        </div>
      ) : (
        /* Gallery Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(photos as unknown as GalleryPhoto[])?.map((photo) => (
            <div key={photo.id} className="bg-white rounded-3xl border border-cream/30 overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-md transition">
              
              {/* Image side-by-side view */}
              <div className="grid grid-cols-2 gap-px bg-cream/20 relative aspect-4/3">
                <div className="relative h-full overflow-hidden">
                  <img src={photo.beforeUrl} alt="Antes" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-[#0f3f3e]/80 text-white text-[9px] font-subtitle uppercase tracking-widest font-bold px-2 py-0.5 rounded-md">Antes</span>
                </div>
                <div className="relative h-full overflow-hidden">
                  <img src={photo.afterUrl} alt="Después" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-terracotta/90 text-white text-[9px] font-subtitle uppercase tracking-widest font-bold px-2 py-0.5 rounded-md">Después</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs font-body text-teal/80 line-clamp-2 italic">
                    {photo.caption || "Sin descripción clínica"}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-teal/50 font-semibold uppercase">
                    <span>Orden: {photo.order}</span>
                    <span>•</span>
                    <span className={photo.isVisible ? "text-emerald-600" : "text-redbrown"}>
                      {photo.isVisible ? "Visible" : "Oculta"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-cream/20 pt-3">
                  <button
                    onClick={() => toggleVisibility(photo)}
                    className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition"
                    title={photo.isVisible ? "Ocultar de la Web" : "Mostrar en la Web"}
                  >
                    {photo.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPhoto(photo);
                        setBeforeUrl(photo.beforeUrl);
                        setAfterUrl(photo.afterUrl);
                        setCaption(photo.caption || "");
                        setOrder(photo.order);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-offwhite hover:bg-cream/10 border border-cream text-teal rounded-xl text-[10px] font-subtitle uppercase tracking-widest font-bold transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 text-redbrown hover:bg-redbrown/5 rounded-xl transition"
                      title="Eliminar Entrada"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-lg rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-title text-xl text-teal font-bold">
                {editingPhoto ? "Editar Comparación" : "Nueva Comparación"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Photo Uploaders (Side by Side) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Before Photo */}
                <div className="space-y-2 flex flex-col items-center">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block self-start">
                    Foto "Antes" *
                  </label>
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-cream flex items-center justify-center relative shadow-sm">
                    {beforeUrl ? (
                      <img src={beforeUrl} alt="Antes" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-teal/30 flex flex-col items-center p-4 text-center">
                        <ImageIcon size={24} />
                        <span className="text-[9px] font-semibold mt-1">Sube foto de antes</span>
                      </div>
                    )}
                    {imageUploading && !beforeUrl && (
                      <div className="absolute inset-0 bg-[#0f3f3e]/65 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-cream border-t-terracotta rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <label className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-offwhite border border-cream text-teal rounded-xl text-[10px] font-subtitle uppercase tracking-wider font-bold cursor-pointer transition">
                    <UploadCloud size={12} className="text-terracotta" />
                    Subir Antes
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, "before")} />
                  </label>
                </div>

                {/* After Photo */}
                <div className="space-y-2 flex flex-col items-center">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block self-start">
                    Foto "Después" *
                  </label>
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-cream flex items-center justify-center relative shadow-sm">
                    {afterUrl ? (
                      <img src={afterUrl} alt="Después" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-teal/30 flex flex-col items-center p-4 text-center">
                        <ImageIcon size={24} />
                        <span className="text-[9px] font-semibold mt-1">Sube foto de después</span>
                      </div>
                    )}
                    {imageUploading && !afterUrl && (
                      <div className="absolute inset-0 bg-[#0f3f3e]/65 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-cream border-t-terracotta rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <label className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-offwhite border border-cream text-teal rounded-xl text-[10px] font-subtitle uppercase tracking-wider font-bold cursor-pointer transition">
                    <UploadCloud size={12} className="text-terracotta" />
                    Subir Después
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, "after")} />
                  </label>
                </div>
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  required
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                />
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Comentario Clínico / Descripción (Opcional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ej: Resultados tras 6 sesiones de fortalecimiento de piso pélvico..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none resize-none"
                />
              </div>

              {/* Status / Save */}
              <div className="pt-2 flex flex-col gap-3">
                {saveStatus === "error" && (
                  <div className="flex items-center gap-1.5 text-redbrown text-xs font-semibold">
                    <AlertCircle size={14} />
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createPhoto.isPending || updatePhoto.isPending || imageUploading}
                    className="flex-1 py-3.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition shadow-md disabled:opacity-50"
                  >
                    {createPhoto.isPending || updatePhoto.isPending ? "Guardando..." : "Guardar Comparación"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
