"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, THEME_STORAGE_KEY, type ThemeId } from "@/config/themes";

function current(): ThemeId {
  return (document.documentElement.getAttribute("data-theme") as ThemeId) || "amber";
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {}
}

function Swatch({ colors, size = 18 }: { colors: readonly string[]; size?: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-white/20"
      style={{ width: size, height: size, background: `conic-gradient(${colors[1]} 0 33%, ${colors[2]} 0 66%, ${colors[3]} 0)` }}
    />
  );
}

/** Переключатель тем: компактная кнопка с выпадающей палитрой (variant="menu") или ряд образцов (variant="row"). */
export function ThemeSwitcher({ variant = "menu" }: { variant?: "menu" | "row" }) {
  const [theme, setTheme] = useState<ThemeId>("amber");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setTheme(current()), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (id: ThemeId) => {
    applyTheme(id);
    setTheme(id);
    setOpen(false);
  };
  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  if (variant === "row") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => choose(t.id)}
            className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
              t.id === theme ? "border-brand/60 bg-brand/10 text-brand" : "border-white/10 bg-white/[0.04] hover:border-white/25"
            }`}
          >
            <Swatch colors={t.swatch} size={22} />
            {t.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Стиль сайта"
        className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
      >
        <Swatch colors={active.swatch} size={14} />
        <span className="hidden sm:inline">Стиль: {active.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-fade-up rounded-2xl border border-white/10 bg-ink-700/95 p-1.5 shadow-2xl backdrop-blur-xl">
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">Стиль сайта</p>
          {THEMES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              style={{ animationDelay: `${i * 35}ms` }}
              className={`flex w-full animate-fade-up items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.07] ${
                t.id === theme ? "bg-white/[0.06]" : ""
              }`}
            >
              <span className="flex -space-x-1.5">
                {t.swatch.map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full ring-2 ring-ink-700" style={{ background: c }} />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{t.name}</span>
                <span className="block truncate text-[11px] text-white/45">{t.hint}</span>
              </span>
              {t.id === theme && <span className="h-2 w-2 rounded-full bg-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
