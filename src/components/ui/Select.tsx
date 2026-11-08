"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string; hint?: string };

type Props = {
  options: SelectOption[];
  /** Управляемое значение */
  value?: string;
  /** Неуправляемое начальное значение (для обычных форм) */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Имя поля — значение попадёт в форму через скрытый input */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  /** site — светлое стекло публичного сайта, admin — строгий вид админки */
  variant?: "site" | "admin";
  className?: string;
  /** Показывать поиск, если вариантов больше этого числа */
  searchFrom?: number;
  searchPlaceholder?: string;
  emptyText?: string;
  "aria-label"?: string;
};

/**
 * Собственный выпадающий список вместо системного <select>:
 * плавное открытие, поиск по длинным спискам, клавиатура (↑ ↓ Enter Esc, набор букв), выбранный пункт с галочкой.
 * Панель рисуется поверх страницы (portal), поэтому её не обрезают карточки с overflow.
 */
export function Select({
  options, value, defaultValue = "", onChange, name, placeholder = "—", disabled, variant = "site",
  className = "", searchFrom = 9, searchPlaceholder = "Поиск…", emptyText = "Ничего не найдено", ...rest
}: Props) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = controlled ? value! : inner;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ s: "", t: 0 });
  const uid = useId();

  const searchable = options.length >= searchFrom;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const selected = options.find((o) => o.value === current);

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 220 && above > below;
    const maxH = Math.max(160, Math.min(320, up ? above : below));
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8)), width: r.width, maxH, ...(up ? { bottom: vh - r.top + 6 } : { top: r.bottom + 6 }) });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onMove = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return; // прокрутка внутри списка
      place();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const i = Math.max(0, shown.findIndex((o) => o.value === current));
    setActive(i);
    if (searchable) setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const close = (refocus = true) => {
    setOpen(false);
    setQuery("");
    if (refocus) btnRef.current?.focus({ preventScroll: true });
  };
  const choose = (v: string) => {
    if (!controlled) setInner(v);
    onChange?.(v);
    close();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(shown.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === "Enter") { e.preventDefault(); if (shown[active]) choose(shown[active].value); }
    else if (e.key === "Tab") close(false);
    else if (!searchable && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      // набор букв без поля поиска: переход к первому подходящему пункту
      const now = Date.now();
      typed.current.s = now - typed.current.t > 700 ? e.key.toLowerCase() : typed.current.s + e.key.toLowerCase();
      typed.current.t = now;
      const i = shown.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.s));
      if (i >= 0) setActive(i);
    }
  };

  const admin = variant === "admin";
  const triggerCls = admin
    ? "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10"
    : "w-full rounded-2xl border border-fg/10 bg-white/70 px-4 py-3 text-sm text-fg focus-visible:border-brand/50 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand/15";
  const panelCls = admin
    ? "rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-12px_rgba(15,23,42,.28)]"
    : "rounded-3xl border border-fg/10 bg-white shadow-[0_24px_60px_-16px_rgba(11,18,32,.35)]";

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? uid : undefined}
        // Имя кнопки включает видимый текст («Марка: Hyundai»), как требует доступность
        aria-label={rest["aria-label"] ? `${rest["aria-label"]}: ${selected ? selected.label : placeholder}` : undefined}
        className={`flex min-h-[44px] items-center justify-between gap-2 text-left outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${triggerCls}`}
      >
        <span className={`truncate ${selected && selected.value !== "" ? "" : admin ? "text-slate-400" : "text-fg/70"}`}>{selected ? selected.label : placeholder}</span>
        <svg viewBox="0 0 12 8" className={`h-2 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${admin ? "text-slate-500" : "text-fg/72"}`} aria-hidden>
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, zIndex: 200 }}
            className={`animate-pop-in overflow-hidden ${panelCls}`}
            onKeyDown={onKey}
          >
            {searchable && (
              <div className="border-b border-black/5 p-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className="w-full rounded-xl bg-black/[0.04] px-3 py-2 text-sm outline-none placeholder:text-black/35 focus:bg-black/[0.06]"
                />
              </div>
            )}
            <ul id={uid} role="listbox" style={{ maxHeight: pos.maxH - (searchable ? 56 : 0) }} className="overflow-y-auto overscroll-contain p-1.5">
              {shown.length === 0 && <li className="px-3 py-3 text-sm text-black/45">{emptyText}</li>}
              {shown.map((o, i) => {
                const sel = o.value === current;
                return (
                  <li
                    key={o.value + i}
                    data-i={i}
                    role="option"
                    aria-selected={sel}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(o.value)}
                    className={`flex min-h-[40px] cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                      i === active ? "bg-brand/10" : ""
                    } ${sel ? "font-semibold text-brand" : admin ? "text-slate-800" : "text-fg"}`}
                  >
                    <span className="min-w-0 truncate">{o.label}{o.hint && <span className="ml-2 text-xs font-normal text-black/40">{o.hint}</span>}</span>
                    {sel && (
                      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden>
                        <path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
