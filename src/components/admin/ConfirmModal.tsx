"use client";

import { X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-subtitle font-bold text-teal text-lg">{title}</h3>
          <button
            onClick={onCancel}
            className="text-teal/40 hover:text-teal ml-4"
          >
            <X size={20} />
          </button>
        </div>
        <p className="font-body text-teal/70 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-cream/40 font-subtitle text-xs font-bold text-teal/70 hover:bg-offwhite transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-subtitle text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
