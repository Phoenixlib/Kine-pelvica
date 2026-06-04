"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User as UserIcon, 
  Home,
  Settings,
  Camera,
  MessageSquare
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/agenda", label: "Agenda", icon: Calendar },
    { href: "/admin/citas", label: "Citas / Reservas", icon: FileText },
    { href: "/admin/pacientes", label: "Fichas Clínicas", icon: Users },
    { href: "/admin/servicios", label: "Servicios / Terapias", icon: Settings },
    { href: "/admin/contenido", label: "Contenido Sitio", icon: Home },
    { href: "/admin/galeria", label: "Galería de Fotos", icon: Camera },
    { href: "/admin/testimonios", label: "Testimonios", icon: MessageSquare },
  ];

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-offwhite text-teal flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-cream/40 bg-white shrink-0 h-screen sticky top-0">
        {/* Brand header */}
        <div className="h-24 flex items-center justify-center px-6 border-b border-cream/40 bg-[#0f3f3e]">
          <Link href="/" className="flex items-center justify-center w-full group py-2">
            <img 
              src="/logo-editado.png" 
              alt="Estudio Pélvico" 
              className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-subtitle text-xs uppercase tracking-wider font-bold transition-all ${
                  isActive
                    ? "bg-[#c48a6a] text-white shadow-sm"
                    : "text-teal/70 hover:bg-[#f7f3ef] hover:text-teal"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info / Sign out */}
        <div className="p-4 border-t border-cream/40 bg-offwhite/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-cream/30 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#0f3f3e]/10 flex items-center justify-center text-[#0f3f3e] font-subtitle font-bold text-sm">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "CO"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-teal truncate">{user.name || "Camila Ortiz"}</p>
              <p className="text-[10px] text-teal/55 truncate font-medium">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-redbrown/20 text-redbrown hover:bg-redbrown/5 font-subtitle text-[10px] uppercase tracking-widest font-bold transition-all"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-cream/40 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-teal hover:bg-[#f7f3ef] rounded-xl transition"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-subtitle font-bold uppercase tracking-wider text-[#0f3f3e] hidden md:block">
              {navItems.find(item => item.href === pathname)?.label || "Administración"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 text-teal/70 hover:text-teal hover:bg-[#f7f3ef] rounded-full transition"
              title="Volver a la Web"
            >
              <Home size={18} />
            </Link>
            
            <button
              className="p-2.5 text-teal/70 hover:text-teal hover:bg-[#f7f3ef] rounded-full transition relative"
              title="Notificaciones"
            >
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#c48a6a] rounded-full border border-white"></span>
            </button>

            <div className="h-8 w-px bg-cream/40"></div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-teal/70 hidden sm:block">
                Camila Ortiz
              </span>
              <div className="w-8 h-8 rounded-full bg-[#c48a6a] text-white flex items-center justify-center text-xs font-subtitle font-bold shadow-sm">
                CO
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-[#0f3f3e]/40 backdrop-blur-xs">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsMobileOpen(false)}
          ></div>
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="h-24 flex items-center justify-between px-6 border-b border-cream/40 bg-[#0f3f3e]">
              <Link href="/" className="flex items-center justify-start group py-2">
                <img 
                  src="/logo-editado.png" 
                  alt="Estudio Pélvico" 
                  className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
                />
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-cream hover:bg-white/10 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-subtitle text-xs uppercase tracking-wider font-bold transition-all ${
                      isActive
                        ? "bg-[#c48a6a] text-white shadow-sm"
                        : "text-teal/70 hover:bg-[#f7f3ef] hover:text-teal"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-cream/40 bg-offwhite/50">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-cream/30 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#0f3f3e]/10 flex items-center justify-center text-[#0f3f3e] font-subtitle font-bold text-sm">
                  CO
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-teal truncate">{user.name || "Camila Ortiz"}</p>
                  <p className="text-[10px] text-teal/55 truncate font-medium">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-redbrown/20 text-redbrown hover:bg-redbrown/5 font-subtitle text-[10px] uppercase tracking-widest font-bold transition-all"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
