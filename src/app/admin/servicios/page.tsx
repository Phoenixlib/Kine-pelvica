"use client";

import { useState, useEffect, useMemo } from "react";
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
  FolderOpen,
  GripHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// Sortable Service Row/Card
function SortableServiceCard({ srv, handleEditServiceClick, handleDeleteService }: { 
  srv: Service; 
  handleEditServiceClick: (s: Service) => void; 
  handleDeleteService: (id: string) => void; 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: srv.id,
    data: { type: "service", categoryId: srv.categoryId || "uncategorized" }
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-offwhite/50 p-4 rounded-2xl border border-cream/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isDragging ? "opacity-50 scale-95" : ""}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button 
          type="button"
          {...attributes} 
          {...listeners}
          className="text-teal/40 hover:text-teal transition p-1 cursor-grab active:cursor-grabbing shrink-0"
          title="Arrastrar para reordenar"
        >
          <GripHorizontal size={14} />
        </button>
        <div className="min-w-0">
          <h4 className="font-subtitle font-bold text-teal text-sm truncate">{srv.name}</h4>
          {srv.description && (
            <p className="text-xs text-teal/70 font-body line-clamp-1 mt-0.5">{srv.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-teal/80 bg-white/80 border border-cream/20 px-2.5 py-1 rounded-xl">
          <Clock size={12} className="text-terracotta" />
          <span>{srv.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal bg-white/80 border border-cream/20 px-2.5 py-1 rounded-xl">
          <DollarSign size={12} className="text-teal/60" />
          <span>${srv.price.toLocaleString("es-CL")}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-subtitle font-bold uppercase tracking-wider ${
          srv.isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-redbrown/10 text-redbrown border border-redbrown/20"
        }`}>
          {srv.isActive ? "Activo" : "Inactivo"}
        </span>

        {srv.calComBookingUrl ? (
          <a
            href={srv.calComBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-cream/10 border border-cream text-teal rounded-xl text-[9px] font-subtitle uppercase tracking-widest font-bold transition"
          >
            <LinkIcon size={10} className="text-terracotta" /> Cal.com
          </a>
        ) : (
          <span className="text-[10px] text-teal/40 font-semibold italic">Sin Cal.com</span>
        )}

        <div className="flex gap-1.5 border-l border-cream/50 pl-3">
          <button
            type="button"
            onClick={() => handleEditServiceClick(srv)}
            className="p-1.5 text-teal/60 hover:text-terracotta hover:bg-white rounded-lg transition"
            title="Editar Servicio"
          >
            <Edit3 size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteService(srv.id)}
            className="p-1.5 text-redbrown/60 hover:text-redbrown hover:bg-white rounded-lg transition"
            title="Eliminar Servicio"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Sortable Category Section
function SortableCategorySection({
  cat,
  services,
  isCollapsed,
  onToggleCollapse,
  handleEditCategoryClick,
  handleDeleteCategory,
  handleEditServiceClick,
  handleDeleteService,
  handleNewServiceForCategory
}: {
  cat: Category;
  services: Service[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  handleEditCategoryClick: (c: Category) => void;
  handleDeleteCategory: (id: string) => void;
  handleEditServiceClick: (s: Service) => void;
  handleDeleteService: (id: string) => void;
  handleNewServiceForCategory: (catId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
    data: { type: "category" }
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white rounded-3xl border border-cream/40 shadow-xs overflow-hidden transition-all ${isDragging ? "opacity-50 scale-98 shadow-md" : ""}`}
    >
      {/* Category Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream/20 bg-[#faf6f2]/85">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            type="button"
            {...attributes} 
            {...listeners}
            className="text-teal/40 hover:text-teal transition p-1.5 cursor-grab active:cursor-grabbing shrink-0"
            title="Arrastrar Categoría"
          >
            <GripHorizontal size={16} />
          </button>
          <button 
            type="button"
            onClick={onToggleCollapse}
            className="p-1 hover:bg-cream/20 rounded-lg text-teal/70 shrink-0"
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <h3 className="font-title text-lg text-teal font-semibold truncate">{cat.name}</h3>
            <span className="shrink-0 inline-flex items-center bg-teal/5 text-teal/80 border border-teal/10 px-2 py-0.5 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider">
              {services.length} {services.length === 1 ? "servicio" : "servicios"}
            </span>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-subtitle font-bold uppercase tracking-wider ${
              cat.isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-redbrown/10 text-redbrown border border-redbrown/20"
            }`}>
              {cat.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleNewServiceForCategory(cat.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white hover:bg-teal/90 text-[10px] font-subtitle uppercase tracking-wider font-bold rounded-xl transition shadow-xs"
          >
            <Plus size={12} /> Añadir Servicio
          </button>
          <button
            type="button"
            onClick={() => handleEditCategoryClick(cat)}
            className="p-2 text-teal/60 hover:text-terracotta hover:bg-cream/10 rounded-xl transition"
            title="Editar Categoría"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCategory(cat.id)}
            className="p-2 text-redbrown/60 hover:text-redbrown hover:bg-redbrown/5 rounded-xl transition"
            title="Eliminar Categoría"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Services List */}
      {!isCollapsed && (
        <div className="p-5 bg-white space-y-3">
          {services.length === 0 ? (
            <div className="text-center py-8 text-teal/50 font-body text-xs italic">
              No hay servicios registrados en esta categoría.
            </div>
          ) : (
            <SortableContext
              items={services.map(s => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="space-y-3">
                {services.map((srv) => (
                  <SortableServiceCard
                    key={srv.id}
                    srv={srv}
                    handleEditServiceClick={handleEditServiceClick}
                    handleDeleteService={handleDeleteService}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

// Uncategorized Services section
function UncategorizedSection({
  services,
  handleEditServiceClick,
  handleDeleteService,
  handleNewServiceForCategory
}: {
  services: Service[];
  handleEditServiceClick: (s: Service) => void;
  handleDeleteService: (id: string) => void;
  handleNewServiceForCategory: (catId: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-dashed border-cream/80 shadow-xs overflow-hidden mt-6">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream/20 bg-offwhite/50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-cream/20 rounded-lg text-teal/70 shrink-0"
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="font-title text-lg text-teal/70 font-semibold truncate italic">Sin Categoría</h3>
            <span className="shrink-0 inline-flex items-center bg-teal/5 text-teal/60 border border-teal/10 px-2 py-0.5 rounded-full text-[10px] font-subtitle font-bold uppercase tracking-wider">
              {services.length} {services.length === 1 ? "servicio" : "servicios"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleNewServiceForCategory("")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white hover:bg-teal/90 text-[10px] font-subtitle uppercase tracking-wider font-bold rounded-xl transition shadow-xs"
          >
            <Plus size={12} /> Añadir Servicio
          </button>
        </div>
      </div>

      {/* Services List */}
      {!isCollapsed && (
        <div className="p-5 bg-white space-y-3">
          {services.length === 0 ? (
            <div className="text-center py-8 text-teal/40 font-body text-xs italic">
              No hay servicios sin categoría.
            </div>
          ) : (
            <SortableContext
              items={services.map(s => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="space-y-3">
                {services.map((srv) => (
                  <SortableServiceCard
                    key={srv.id}
                    srv={srv}
                    handleEditServiceClick={handleEditServiceClick}
                    handleDeleteService={handleDeleteService}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiciosPage() {
  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // State for Service Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState<number | "">("");
  const [serviceDuration, setServiceDuration] = useState<number | "">("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [serviceIsActive, setServiceIsActive] = useState(true);

  // State for Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIsActive, setCategoryIsActive] = useState(true);

  // State for Custom Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "service" | "category" } | null>(null);

  // Drag and Drop Local States
  const [localServices, setLocalServices] = useState<Service[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  const utils = api.useUtils();
  const { data: services, isLoading: servicesLoading } = api.service.getAllAdmin.useQuery();
  const { data: categories, isLoading: categoriesLoading } = api.service.getCategories.useQuery();

  useEffect(() => {
    if (services) {
      setLocalServices(services as unknown as Service[]);
    }
  }, [services]);

  useEffect(() => {
    if (categories) {
      setLocalCategories(categories as unknown as Category[]);
    }
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reorderServices = api.service.reorderServices.useMutation({
    onSuccess: async () => {
      await utils.service.getAllAdmin.invalidate();
    }
  });

  const reorderCategories = api.service.reorderCategories.useMutation({
    onSuccess: async () => {
      await utils.service.getCategories.invalidate();
    }
  });

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    localCategories.forEach(cat => {
      groups[cat.id] = [];
    });
    groups["uncategorized"] = [];

    localServices.forEach(srv => {
      if (srv.categoryId && groups[srv.categoryId]) {
        groups[srv.categoryId]!.push(srv);
      } else {
        groups["uncategorized"]!.push(srv);
      }
    });

    // Sort within groups
    Object.keys(groups).forEach(key => {
      groups[key]!.sort((a, b) => a.order - b.order);
    });

    return groups;
  }, [localServices, localCategories]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType !== overType) return;

    if (activeType === "category") {
      if (activeId !== overId) {
        setLocalCategories((prev) => {
          const oldIndex = prev.findIndex((c) => c.id === activeId);
          const newIndex = prev.findIndex((c) => c.id === overId);
          const newItems = arrayMove(prev, oldIndex, newIndex);

          const updates = newItems.map((item, idx) => ({
            id: item.id,
            order: idx,
          }));
          reorderCategories.mutate(updates);

          return newItems.map((item, idx) => ({
            ...item,
            order: idx,
          }));
        });
      }
    } else if (activeType === "service") {
      const activeCatId = active.data.current?.categoryId;
      const overCatId = over.data.current?.categoryId;

      // Only allow sorting within the same category
      if (activeCatId === overCatId) {
        if (activeId !== overId) {
          setLocalServices((prev) => {
            const catServices = prev
              .filter((s) => (s.categoryId || "uncategorized") === activeCatId)
              .sort((a, b) => a.order - b.order);

            const oldIndexInCat = catServices.findIndex((s) => s.id === activeId);
            const newIndexInCat = catServices.findIndex((s) => s.id === overId);

            const reorderedCatServices = arrayMove(catServices, oldIndexInCat, newIndexInCat);

            const updates = reorderedCatServices.map((s, idx) => ({
              id: s.id,
              order: idx,
            }));
            reorderServices.mutate(updates);

            const updatedCatServicesMap = new Map(
              reorderedCatServices.map((s, idx) => [s.id, idx])
            );

            return prev.map((s) => {
              const currentCatId = s.categoryId || "uncategorized";
              if (currentCatId === activeCatId) {
                const newOrder = updatedCatServicesMap.get(s.id);
                return {
                  ...s,
                  order: newOrder !== undefined ? newOrder : s.order,
                };
              }
              return s;
            });
          });
        }
      }
    }
  };

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
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
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
      await utils.service.getAllAdmin.invalidate();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  });

  const resetServiceForm = () => {
    setEditingService(null);
    setServiceName("");
    setServicePrice("");
    setServiceDuration("");
    setServiceDescription("");
    setServiceCategoryId("");
    setServiceIsActive(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryIsActive(true);
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price);
    setServiceDuration(service.duration);
    setServiceDescription(service.description || "");
    setServiceCategoryId(service.categoryId || "");
    setServiceIsActive(service.isActive);
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || servicePrice === "" || serviceDuration === "" || Number(servicePrice) <= 0 || Number(serviceDuration) <= 0) return;

    if (editingService) {
      updateService.mutate({
        id: editingService.id,
        name: serviceName,
        price: Number(servicePrice),
        duration: Number(serviceDuration),
        description: serviceDescription || null,
        categoryId: serviceCategoryId || null,
        isActive: serviceIsActive,
      });
    } else {
      createService.mutate({
        name: serviceName,
        price: Number(servicePrice),
        duration: Number(serviceDuration),
        description: serviceDescription || null,
        categoryId: serviceCategoryId || null,
      });
    }
  };

  const handleDeleteService = (id: string) => {
    setItemToDelete({ id, type: "service" });
    setIsDeleteModalOpen(true);
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
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
        isActive: categoryIsActive,
      });
    } else {
      createCategory.mutate({
        name: categoryName,
      });
    }
  };

  const handleDeleteCategory = (id: string) => {
    setItemToDelete({ id, type: "category" });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "service") {
      deleteService.mutate({ id: itemToDelete.id });
    } else {
      deleteCategory.mutate({ id: itemToDelete.id });
    }
  };

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleNewServiceForCategory = (catId: string) => {
    resetServiceForm();
    setServiceCategoryId(catId);
    setIsServiceModalOpen(true);
  };

  const isLoading = servicesLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl text-teal">Servicios y Categorías</h1>
          <p className="font-body text-sm text-teal/70 mt-1">
            Administra tus terapias clínicas, ordénalas arrastrándolas y sincronízalas automáticamente con Cal.com.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { resetCategoryForm(); setIsCategoryModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-cream hover:bg-offwhite text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition text-teal shadow-xs"
          >
            <Plus size={14} /> Nueva Categoría
          </button>
          <button 
            onClick={() => { resetServiceForm(); setIsServiceModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white hover:bg-teal/90 text-xs font-subtitle uppercase tracking-widest font-bold rounded-xl transition shadow-md"
          >
            <Plus size={14} /> Nuevo Servicio
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/40 font-medium shadow-xs">
          <div className="w-8 h-8 border-2 border-cream border-t-terracotta rounded-full animate-spin mx-auto mb-3"></div>
          Cargando estructura de servicios y categorías...
        </div>
      ) : localCategories.length === 0 && (groupedServices["uncategorized"]?.length || 0) === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-cream/30 text-center text-teal/50 font-medium shadow-xs">
          No hay servicios ni categorías registrados. Crea una nueva categoría o servicio para comenzar.
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {localCategories.length > 0 && (
              <SortableContext 
                items={localCategories.map(c => c.id)}
                strategy={rectSortingStrategy}
              >
                <div className="space-y-6">
                  {localCategories.map((cat) => (
                    <SortableCategorySection
                      key={cat.id}
                      cat={cat}
                      services={groupedServices[cat.id] || []}
                      isCollapsed={!!collapsedCategories[cat.id]}
                      onToggleCollapse={() => toggleCategoryCollapse(cat.id)}
                      handleEditCategoryClick={handleEditCategoryClick}
                      handleDeleteCategory={handleDeleteCategory}
                      handleEditServiceClick={handleEditServiceClick}
                      handleDeleteService={handleDeleteService}
                      handleNewServiceForCategory={handleNewServiceForCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            )}

            {/* Uncategorized Services section */}
            {groupedServices["uncategorized"] && groupedServices["uncategorized"].length > 0 && (
              <UncategorizedSection
                services={groupedServices["uncategorized"]}
                handleEditServiceClick={handleEditServiceClick}
                handleDeleteService={handleDeleteService}
                handleNewServiceForCategory={handleNewServiceForCategory}
              />
            )}
          </div>
        </DndContext>
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
                    onChange={(e) => setServicePrice(e.target.value === "" ? "" : Number(e.target.value))}
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
                    onChange={(e) => setServiceDuration(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-cream rounded-xl font-body text-sm text-teal focus:outline-none"
                  />
                </div>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-redbrown/10 text-redbrown flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-title text-xl text-teal">
                  {itemToDelete?.type === "service" ? "¿Eliminar servicio?" : "¿Eliminar categoría?"}
                </h3>
                <p className="font-body text-sm text-teal/70 mt-2">
                  {itemToDelete?.type === "service" 
                    ? "Esta acción borrará de forma permanente este servicio de la base de datos y de Cal.com. No se puede deshacer."
                    : "Esta acción borrará de forma permanente esta categoría. Los servicios asociados quedarán sin categoría. No se puede deshacer."
                  }
                </p>
              </div>
            </div>
            <div className="p-4 bg-offwhite/50 border-t border-cream flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                disabled={deleteService.isPending || deleteCategory.isPending}
                className="flex-1 px-4 py-2.5 border border-cream text-teal rounded-xl font-subtitle text-[10px] uppercase tracking-wider font-bold hover:bg-cream/50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteService.isPending || deleteCategory.isPending}
                className="flex-1 px-4 py-2.5 bg-redbrown text-white rounded-xl font-subtitle text-[10px] uppercase tracking-wider font-bold hover:bg-redbrown/90 transition disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {deleteService.isPending || deleteCategory.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
