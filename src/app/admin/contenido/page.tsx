"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useCloudinaryUpload } from "~/hooks/useCloudinaryUpload";
import { 
  FileText, 
  Image as ImageIcon, 
  UploadCloud, 
  Check, 
  AlertCircle,
  MapPin
} from "lucide-react";

export default function ContenidoPage() {
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutDescription, setAboutDescription] = useState("");
  const [aboutImageUrl, setAboutImageUrl] = useState("");
  const [address, setAddress] = useState("");

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const { uploadFiles, uploading: imageUploading } = useCloudinaryUpload();

  // Query config keys from database
  const { data: configData, isLoading: configLoading, refetch } = api.siteConfig.get.useQuery({
    keys: ["about_title", "about_description", "about_image", "address"],
  });

  const setConfigMany = api.siteConfig.setMany.useMutation({
    onSuccess: async () => {
      setSaveStatus("success");
      await refetch();
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: (err) => {
      setSaveStatus("error");
      setSaveError(err.message || "Error al guardar el contenido.");
    }
  });

  useEffect(() => {
    if (configData) {
      setAboutTitle(configData.about_title || "");
      setAboutDescription(configData.about_description || "");
      setAboutImageUrl(configData.about_image || "");
      setAddress(configData.address || "");
    }
  }, [configData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    try {
      const results = await uploadFiles([file]);
      if (results && results[0]) {
        setAboutImageUrl(results[0].secureUrl);
      }
    } catch (err) {
      console.error("Error uploading profile image:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");

    setConfigMany.mutate({
      configs: [
        { key: "about_title", value: aboutTitle },
        { key: "about_description", value: aboutDescription },
        { key: "about_image", value: aboutImageUrl },
        { key: "address", value: address },
      ]
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="font-title text-3xl text-teal">Contenido del Sitio</h1>
        <p className="font-body text-sm text-teal/70 mt-1">
          Edita dinámicamente las secciones, biografía y textos públicos de tu sitio web.
        </p>
      </div>

      {configLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
          <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
          Cargando configuración...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Quién Soy */}
          <div className="bg-white rounded-3xl border border-cream/30 shadow-xs p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-cream/20 pb-4">
              <FileText className="text-terracotta" size={20} />
              <h2 className="font-title text-xl text-teal">Sección "Quién Soy"</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Photo Uploader */}
              <div className="md:col-span-1 flex flex-col items-center justify-start space-y-4">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block self-start">
                  Foto de Perfil
                </label>

                <div className="relative w-48 h-48 rounded-full overflow-hidden bg-offwhite border border-cream flex items-center justify-center group shadow-inner">
                  {aboutImageUrl ? (
                    <img 
                      src={aboutImageUrl} 
                      alt="Perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-teal/30 flex flex-col items-center">
                      <ImageIcon size={32} />
                      <span className="text-[10px] font-semibold mt-1">Sin foto</span>
                    </div>
                  )}

                  {imageUploading && (
                    <div className="absolute inset-0 bg-[#0f3f3e]/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-offwhite hover:bg-cream/10 border border-cream text-teal rounded-xl text-xs font-subtitle uppercase tracking-widest font-bold cursor-pointer transition">
                    <UploadCloud size={14} className="text-terracotta" />
                    <span>{aboutImageUrl ? "Cambiar Foto" : "Subir Foto"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Text Fields */}
              <div className="md:col-span-2 space-y-5">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Título de la Sección *
                  </label>
                  <input
                    type="text"
                    required
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    placeholder="Ej: Kine Pélvica Camila Ortiz"
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Descripción / Biografía *
                  </label>
                  <textarea
                    required
                    value={aboutDescription}
                    onChange={(e) => setAboutDescription(e.target.value)}
                    placeholder="Escribe aquí tu trayectoria, especialidad clínica, pasiones..."
                    rows={8}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Cómo Llegar */}
          <div className="bg-white rounded-3xl border border-cream/30 shadow-xs p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-cream/20 pb-4">
              <MapPin className="text-terracotta" size={20} />
              <h2 className="font-title text-xl text-teal">Sección "Cómo llegar"</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Dirección Física *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Providencia 1234, Providencia, Chile"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                />
              </div>

              <div className="bg-offwhite p-4 rounded-xl border border-cream/50 space-y-3">
                <p className="text-xs font-semibold text-teal/70">Vista previa del mapa generado automáticamente:</p>
                {address ? (
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                    className="w-full h-[300px] border-0 rounded-lg shadow-sm"
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-cream/20 rounded-lg text-teal/40 text-sm font-medium border border-cream/50 border-dashed">
                    Ingresa una dirección para ver el mapa
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions / Feedback */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-cream/30 shadow-xs">
            <div>
              {saveStatus === "success" && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <Check size={16} className="bg-emerald-50 border border-emerald-200 rounded-full p-0.5" />
                  <span>¡Cambios guardados con éxito! El landing se ha actualizado.</span>
                </div>
              )}

              {saveStatus === "error" && (
                <div className="flex items-center gap-2 text-redbrown text-xs font-semibold">
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              )}

              {saveStatus === "idle" && (
                <span className="text-xs text-teal/40 font-semibold italic">Tienes cambios sin guardar.</span>
              )}

              {saveStatus === "saving" && (
                <span className="text-xs text-teal/60 font-semibold">Guardando cambios en el servidor...</span>
              )}
            </div>

            <button
              type="submit"
              disabled={saveStatus === "saving" || imageUploading}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-teal text-white hover:bg-teal/90 text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-md disabled:opacity-50"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
