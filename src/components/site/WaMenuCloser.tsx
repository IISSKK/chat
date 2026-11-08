"use client";

import { useEffect } from "react";

/** Закрывает открытые списки номеров WhatsApp (<details data-wa>) по клику вне списка, выбору номера и Esc. Один обработчик на всю страницу. */
export function WaMenuCloser() {
  useEffect(() => {
    const closeAll = (except?: Element | null) => document.querySelectorAll<HTMLDetailsElement>("details[data-wa][open]").forEach((d) => d !== except && d.removeAttribute("open"));
    const onClick = (e: Event) => {
      const t = e.target as Element | null;
      const inside = t?.closest?.("details[data-wa]") ?? null;
      closeAll(inside && t?.closest("a[role=menuitem]") ? null : inside);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}
