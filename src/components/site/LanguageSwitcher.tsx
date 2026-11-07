"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_INFO, localePath, stripLocale, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { GlobeIcon } from "@/components/icons";

function setLocaleCookie(l: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Переключатель языка.
 *  variant="menu"  — компактная кнопка в шапке с выпадающим списком;
 *  variant="row"   — ряд кнопок-сегментов (мобильное меню).
 */
export function LanguageSwitcher({ variant = "menu" }: { variant?: "menu" | "row" }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const choose = (l: Locale) => {
    setOpen(false);
    if (l === locale) return;
    setLocaleCookie(l);
    // Переходим на ту же страницу на другом языке: /catalog/cars → /en/catalog/cars
    const qs = search.toString();
    const target = localePath(l, stripLocale(pathname).path) + (qs ? `?${qs}` : "");
    start(() => router.push(target));
  };

  if (variant === "row") {
    return (
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-fg/[0.05] p-1" role="radiogroup" aria-label={t.lang.label}>
        {LOCALES.map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={l === locale}
            onClick={() => choose(l)}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold ${
              l === locale ? "bg-white text-brand shadow-[0_1px_4px_rgba(15,40,90,.12)]" : "text-fg/60"
            }`}
          >
            <span className="text-base leading-none">{LOCALE_INFO[l].flag}</span>
            {LOCALE_INFO[l].native}
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
        aria-haspopup="listbox"
        aria-label={t.lang.label}
        className="flex h-10 items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 text-sm font-bold text-fg/80 hover:bg-fg/10"
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
        ) : (
          <GlobeIcon className="h-4 w-4 text-brand" />
        )}
        <span>{LOCALE_INFO[locale].short}</span>
      </button>
      {open && (
        <div role="listbox" className="glass absolute right-0 top-full z-50 mt-2 w-48 origin-top-right animate-pop-in rounded-2xl !bg-white p-1.5">
          {LOCALES.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={l === locale}
              onClick={() => choose(l)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-fg/[0.06] ${
                l === locale ? "text-brand" : ""
              }`}
            >
              <span className="text-lg leading-none">{LOCALE_INFO[l].flag}</span>
              <span className="flex-1">{LOCALE_INFO[l].native}</span>
              {l === locale && <span className="text-brand">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
