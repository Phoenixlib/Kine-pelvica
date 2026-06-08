"use client";

import { useState, useEffect } from "react";
import { cn } from "../utils";
import { Menu, X } from "lucide-react";

export function Navbar({
  isAdmin = false,
  forceSolid = false,
}: {
  isAdmin?: boolean;
  forceSolid?: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Inicio", href: "/#inicio" },
    { name: "Quién Soy", href: "/#quien-soy" },
    { name: "Servicios", href: "/#servicios" },
    { name: "Antes y Después", href: "/#galeria" },
    { name: "Testimonios", href: "/#testimonios" },
    { name: "Blog", href: "/blog" },
    { name: "Buzón comunidad", href: "/#buzon" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        isScrolled || forceSolid
          ? "bg-teal/95 backdrop-blur-md shadow-md py-4 border-b border-teal"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 lg:px-6 xl:px-8 flex justify-between items-center">
        {/* Logo Image for Navbar */}
        <a href="/" className="flex items-center space-x-3 group">
          <img
            src="/logo-editado.png"
            alt="Estudio Pélvico"
            className="h-[56px] md:h-[64px] xl:h-[72px] w-auto object-contain transition-transform group-hover:scale-105"
          />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center lg:space-x-4 xl:space-x-6 2xl:space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="font-subtitle lg:text-[10px] xl:text-[11px] uppercase lg:tracking-wider xl:tracking-widest font-bold text-offwhite/90 hover:text-terracotta transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-terracotta transition-all group-hover:w-full"></span>
            </a>
          ))}
          {isAdmin ? (
            <a
              href="/admin"
              className="lg:px-4 xl:px-6 py-2.5 bg-terracotta text-white lg:text-[9px] xl:text-[10px] uppercase lg:tracking-wider xl:tracking-widest font-bold rounded-full hover:bg-terracotta/90 transition-all shadow-sm"
            >
              Panel Admin
            </a>
          ) : (
            <a
              href="/#servicios"
              className="lg:px-4 xl:px-6 py-2.5 bg-cream text-teal lg:text-[9px] xl:text-[10px] uppercase lg:tracking-wider xl:tracking-widest font-bold rounded-full hover:bg-white transition-all shadow-sm"
            >
              Agendar Hora
            </a>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-offwhite"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-teal shadow-lg border-t border-white/10">
          <nav className="flex flex-col py-4 px-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-subtitle text-xs uppercase tracking-widest font-bold text-offwhite/80 pb-3 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            {isAdmin && (
              <a
                href="/admin"
                className="font-subtitle text-xs uppercase tracking-widest font-bold text-terracotta pb-3 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Panel Admin
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
