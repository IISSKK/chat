import { siteConfig, type Locale } from "@/config/site";
import ru, { type Dictionary } from "./dictionaries/ru";

/**
 * Простая i18n-прослойка. Чтобы добавить английский:
 * 1) создайте src/i18n/dictionaries/en.ts с тем же набором ключей (тип Dictionary);
 * 2) добавьте его в `dictionaries` ниже и "en" в siteConfig.locales;
 * 3) выберите локаль по cookie/заголовку или префиксу URL в getLocale().
 */
const dictionaries: Partial<Record<Locale, Dictionary>> = { ru };

export function getLocale(): Locale {
  return siteConfig.defaultLocale;
}

export function getDictionary(locale: Locale = getLocale()): Dictionary {
  return dictionaries[locale] ?? ru;
}

export const t = getDictionary();
export type { Dictionary };
