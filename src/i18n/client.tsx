"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./dictionaries/ru";
import type { Locale } from "./config";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

/** Передаёт словарь текущего языка клиентским компонентам. */
export function I18nProvider({ locale, t, children }: { locale: Locale; t: Dictionary; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useT(): Dictionary {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT() вне I18nProvider");
  return ctx.t;
}

export function useLocale(): Locale {
  return useContext(I18nContext)?.locale ?? "ru";
}
