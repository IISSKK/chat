"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Подтвердить",
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div role="alertdialog" aria-modal className="w-full max-w-sm animate-fade-up rounded-2xl bg-white p-6 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{text}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="a-btn-ghost">Отмена</button>
          <button onClick={onConfirm} disabled={busy} className="a-btn-danger" autoFocus>
            {busy ? "Удаляем…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
