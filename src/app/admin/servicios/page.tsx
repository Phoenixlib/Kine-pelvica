"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Link as LinkIcon, 
  Clock, 
  DollarSign, 
  Settings,
  FolderOpen
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string | null;
  isActive: boolean;
  order: number;
  categoryId: string | null;
  category: Category | null;
  calComEventTypeId: number | null;
  calComBookingUrl: string | null;
  calComSlug: string | null;
}

export default function ServiciosPage() {
  const [activeTab, setActiveTab] = useState<"services" | "categories">("services");

  // State for Service Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState(30000);
  const [serviceDuration, setServiceDuration] = useState(60);
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [serviceOrder, setServiceOrder] = useState(0);
  const [serviceIsActive, setServiceIsActive] = useState(true);

  // State for Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState(0);
  const [categoryIsActive, setCategoryIsActive] = useState(true);

  const utils = api.useUtils();
  const { data: services, isLoading: servicesLoading } = api.service.getAllAdmin.useQuery();
  const { data: categories, isLoading: categoriesLoading } = api.service.getCategories.useQuery();

  const createService = api.service.createService.useMutation({
    onSuccess: async () => {
      await utils.service.getAllAdmin.invalidate();
      setIsServiceModalOpen(false);
      resetServiceForm();
    }
  });

  const updateService = api.service.updateService.useMutation({
    onSuccess: async () => {
      await utils.service.getAllAdmin.invalidate();
      setIsServiceModalOpen(false);
      resetServiceForm();
    }
  });

  const deleteService = api.service.deleteService.useMutation({
    onSuccess: async () => {
      await utils.service.getAllAdmin.invalidate();
    }
  });

  const createCategory = api.service.createCategory.useMutation({
    onSuccess: async () => {
      await utils.service.getCategories.invalidate();
      setIsCategoryModalOpen(false);
      resetCategoryForm();
    }
  });

  const updateCategory = api.service.updateCategory.useMutation({
    onSuccess: async () => {
      await utils.service.getCategories.invalidate();
      await utils.service.getAllAdmin.invalidate();
      setIsCategoryModalOpen(false);
      resetCategoryForm();
    }
  });

  const deleteCategory = api.service.deleteCategory.useMutation({
    onSuccess: async () => {
      await utils.service.getCategories.invalidate();
    }
  });

  const resetServiceForm = () => {
    setEditingService(null);
    setServiceName("");
    setServicePrice(30000);
    setServiceDuration(60);
    setServiceDescription("");
    setServiceCategoryId("");
    setServiceOrder(0);
    setServiceIsActive(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryOrder(0);
    setCategoryIsActive(true);
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price);
    setServiceDuration(service.duration);
    setServiceDescription(service.description || "");
    setServiceCategoryId(service.categoryId || "");
    setServiceOrder(service.order);
    setServiceIsActive(service.isActive);
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || servicePrice <= 0 || serviceDuration <= 0) return;

    if (editingService) {
      updateService.mutate({
        id: editingService.id,
        name: serviceName,
        price: servicePrice,
        duration: serviceDuration,
        description: serviceDescription || null,
        categoryId: serviceCategoryId || null,
        order: serviceOrder,
        isActive: serviceIsActive,
      });
    } else {
      createService.mutate({
        name: serviceName,
        price: servicePrice,
        duration: serviceDuration,
        description: serviceDescription || null,
        categoryId: serviceCategoryId || null,
        order: serviceOrder,
      });
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm("¿Estás segura de que deseas eliminar este servicio? También se eliminará en Cal.com.")) {
      deleteService.mutate({ id });
    }
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryOrder(category.order);
    setCategoryIsActive(category.isActive);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        name: categoryName,
        order: categoryOrder,
        isActive: categoryIsActive,
      });
    } else {
      createCategory.mutate({
        name: categoryName,
        order: categoryOrder,
      });
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("¿Estás segura de que deseas eliminar esta categoría? Los servicios asociados quedarán sin categoría.")) {
      deleteCategory.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl text-teal">Servicios y Categorías</h1>
          <p className="font-body text-sm text-teal/70 mt-1">
            Administra tus terapias clínicas y sincronízalas automáticamente con Cal.com.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "services" ? (
            <button 
              onClick={() => { resetServiceForm(); setIsServiceModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white hover:bg-teal/90 text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-md"
            >
              <Plus size={14} /> Nuevo Servicio
            </button>
          ) : (
            <button 
              onClick={() => { resetCategoryForm(); setIsCategoryModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white hover:bg-teal/90 text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-md"
            >
              <Plus size={14} /> Nueva Categoría
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-cream/30 gap-6">
        <button
          onClick={() => setActiveTab("services")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 transition ${
            activeTab === "services"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Servicios ({services?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-3 font-subtitle text-xs uppercase tracking-widest font-bold border-b-2 transition ${
            activeTab === "categories"
              ? "border-terracotta text-teal"
              : "border-transparent text-teal/40 hover:text-teal/75"
          }`}
        >
          Categorías ({categories?.length || 0})
        </button>
      </div>

      {activeTab === "services" ? (
        <>
          {/* Services Desktop View */}
          <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body text-teal">
                <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
                  <tr>
                    <th className="px-6 py-4">Servicio</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Duración</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Link Cal.com</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream/10">
                  {servicesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-teal/40 font-medium">
                        <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
                        Cargando servicios...
                      </td>
                    </tr>
                  ) : services?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-teal/50 font-medium">
                        No hay servicios registrados. Crea uno nuevo para comenzar.
                      </td>
                    </tr>
                  ) : (
                    (services as unknown as Service[])?.map((srv) => (
                      <tr key={srv.id} className="hover:bg-offwhite/30 transition-colors">
                        <td className="px-6 py-4 font-subtitle font-bold text-teal">
                          {srv.name}
                          {srv.description && (
                            <span className="block text-[10px] text-teal/50 font-body font-normal mt-0.5 line-clamp-1 max-w-xs">
                              {srv.description}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-teal/80">
                            {srv.category?.name || "Sin Categoría"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-teal/80">
                          {srv.duration} mins
                        </td>
                        <td className="px-6 py-4 font-semibold text-teal/80">
                          ${srv.price.toLocaleString("es-CL")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-subtitle font-bold uppercase tracking-wider ${
                            srv.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                          }`}>
                            {srv.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {srv.calComBookingUrl ? (
                            <a
                              href={srv.calComBookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-offwhite hover:bg-cream/10 border border-cream text-teal rounded-xl text-[10px] font-subtitle uppercase tracking-widest font-bold transition"
                            >
                              <LinkIcon size={10} className="text-terracotta" /> Abrir Link
                            </a>
                          ) : (
                            <span className="text-[10px] text-teal/40 font-semibold italic">No Sincronizado</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditServiceClick(srv)}
                              className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition"
                              title="Editar Servicio"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(srv.id)}
                              className="p-2 text-redbrown/60 hover:text-redbrown hover:bg-redbrown/5 rounded-xl transition"
                              title="Eliminar Servicio"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Services Mobile View */}
          <div className="md:hidden space-y-4">
            {servicesLoading ? (
              <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
                <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
                Cargando servicios...
              </div>
            ) : services?.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium">
                No hay servicios registrados.
              </div>
            ) : (
              (services as unknown as Service[])?.map((srv) => (
                <div key={srv.id} className="bg-white p-5 rounded-3xl border border-cream/30 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-subtitle font-bold text-teal text-sm leading-tight">{srv.name}</h3>
                      <span className="text-[10px] text-teal/50 font-semibold uppercase mt-0.5 block">{srv.category?.name || "Sin Categoría"}</span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-subtitle font-bold uppercase tracking-wider ${
                      srv.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                    }`}>
                      {srv.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {srv.description && (
                    <p className="text-xs text-teal/70 font-body line-clamp-2">{srv.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-offwhite/50 border border-cream/10 rounded-2xl p-3 text-xs font-body text-teal">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-terracotta" />
                      <span>{srv.duration} minutos</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <DollarSign size={13} className="text-teal/60" />
                      <span className="font-bold">${srv.price.toLocaleString("es-CL")}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    {srv.calComBookingUrl ? (
                      <a
                        href={srv.calComBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 bg-offwhite hover:bg-cream/10 border border-cream text-teal rounded-xl text-[9px] font-subtitle uppercase tracking-widest font-bold transition"
                      >
                        <LinkIcon size={10} className="text-terracotta" /> Booking Link
                      </a>
                    ) : (
                      <span className="text-[10px] text-teal/40 font-semibold italic">Sin Sincronizar</span>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditServiceClick(srv)}
                        className="p-2 text-teal/60 bg-offwhite hover:bg-cream/20 rounded-xl transition border border-cream/50"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(srv.id)}
                        className="p-2 text-redbrown/65 bg-redbrown/5 hover:bg-redbrown/10 rounded-xl transition border border-redbrown/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Categories Desktop View */}
          <div className="hidden md:block bg-white rounded-3xl border border-cream/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body text-teal">
                <thead className="bg-[#f7f3ef] font-subtitle uppercase tracking-widest text-[9px] font-bold text-teal/65 border-b border-cream/30">
                  <tr>
                    <th className="px-6 py-4">Nombre de Categoría</th>
                    <th className="px-6 py-4">Orden de Visualización</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream/10">
                  {categoriesLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-teal/40 font-medium">
                        <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
                        Cargando categorías...
                      </td>
                    </tr>
                  ) : categories?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-teal/50 font-medium">
                        No hay categorías registradas. Crea una nueva para agrupar tus terapias.
                      </td>
                    </tr>
                  ) : (
                    (categories as unknown as Category[])?.map((cat) => (
                      <tr key={cat.id} className="hover:bg-offwhite/30 transition-colors">
                        <td className="px-6 py-4 font-subtitle font-bold text-teal">
                          {cat.name}
                        </td>
                        <td className="px-6 py-4 font-semibold text-teal/80">
                          {cat.order}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-subtitle font-bold uppercase tracking-wider ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                          }`}>
                            {cat.isActive ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCategoryClick(cat)}
                              className="p-2 text-teal/60 hover:text-terracotta hover:bg-offwhite rounded-xl transition"
                              title="Editar Categoría"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 text-redbrown/60 hover:text-redbrown hover:bg-redbrown/5 rounded-xl transition"
                              title="Eliminar Categoría"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categories Mobile View */}
          <div className="md:hidden space-y-4">
            {categoriesLoading ? (
              <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium">
                <div className="w-6 h-6 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-2"></div>
                Cargando categorías...
              </div>
            ) : categories?.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium">
                No hay categorías registradas.
              </div>
            ) : (
              (categories as unknown as Category[])?.map((cat) => (
                <div key={cat.id} className="bg-white p-5 rounded-3xl border border-cream/30 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-subtitle font-bold text-teal text-sm">{cat.name}</h3>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-subtitle font-bold uppercase tracking-wider ${
                      cat.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-redbrown/10 text-redbrown border border-redbrown/20"
                    }`}>
                      {cat.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-cream/10 mt-2">
                    <span className="text-[11px] text-teal/65 font-body">Orden: <strong>{cat.order}</strong></span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCategoryClick(cat)}
                        className="p-2 text-teal/60 bg-offwhite hover:bg-cream/20 rounded-xl transition border border-cream/50"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-redbrown/65 bg-redbrown/5 hover:bg-redbrown/10 rounded-xl transition border border-redbrown/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="text-terracotta" size={20} />
                <h3 className="font-title text-xl text-teal">
                  {editingService ? "Editar Servicio" : "Nuevo Servicio"}
                </h3>
              </div>
              <button 
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleServiceSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ej: Evaluación de Suelo Pélvico"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Categoría
                </label>
                <select
                  value={serviceCategoryId}
                  onChange={(e) => setServiceCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                >
                  <option value="">Sin Categoría</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Precio ($ CLP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                  />
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
                  value={serviceOrder}
                  onChange={(e) => setServiceOrder(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                />
              </div>

              {/* Active Toggle (Only show if editing) */}
              {editingService && (
                <div className="flex items-center justify-between p-3 bg-white border border-cream/50 rounded-xl">
                  <span className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal">
                    Estado Activo
                  </span>
                  <input
                    type="checkbox"
                    checked={serviceIsActive}
                    onChange={(e) => setServiceIsActive(e.target.checked)}
                    className="w-4 h-4 text-teal focus:ring-teal border-cream rounded"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Descripción
                </label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Detalles sobre en qué consiste este tratamiento..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 py-3.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createService.isPending || updateService.isPending}
                  className="flex-1 py-3.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
                >
                  {createService.isPending || updateService.isPending ? "Guardando..." : "Guardar Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f3f3e]/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative bg-offwhite w-full max-w-md rounded-3xl shadow-2xl border-t-[8px] border-terracotta overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-cream/30 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="text-terracotta" size={20} />
                <h3 className="font-title text-xl text-teal">
                  {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                </h3>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 hover:bg-offwhite rounded-xl text-teal/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCategorySubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Nombre de Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ej: Atenciones Pélvicas"
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                />
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal block">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  required
                  value={categoryOrder}
                  onChange={(e) => setCategoryOrder(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                />
              </div>

              {/* Active Toggle (Only show if editing) */}
              {editingCategory && (
                <div className="flex items-center justify-between p-3 bg-white border border-cream/50 rounded-xl">
                  <span className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal">
                    Estado Activo
                  </span>
                  <input
                    type="checkbox"
                    checked={categoryIsActive}
                    onChange={(e) => setCategoryIsActive(e.target.checked)}
                    className="w-4 h-4 text-teal focus:ring-teal border-cream rounded"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-3.5 border border-cream rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase hover:bg-cream/10 text-teal transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                  className="flex-1 py-3.5 bg-teal hover:bg-teal/90 text-white rounded-xl font-subtitle font-bold text-[10px] tracking-widest uppercase transition-all shadow-md disabled:opacity-50"
                >
                  {createCategory.isPending || updateCategory.isPending ? "Guardando..." : "Guardar Categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
