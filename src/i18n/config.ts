/** Поддерживаемые языки интерфейса. Новый язык: словарь в dictionaries/ + запись здесь + в index.ts. */
export const LOCALES = ["ru", "en", "ko", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "bk_lang";

/** Подписи для переключателя (на родном языке) */
export const LOCALE_INFO: Record<Locale, { native: string; short: string; flag: string }> = {
  ru: { native: "Русский", short: "RU", flag: "🇷🇺" },
  en: { native: "English", short: "EN", flag: "🇬🇧" },
  ko: { native: "한국어", short: "KO", flag: "🇰🇷" },
  zh: { native: "中文", short: "中文", flag: "🇨🇳" },
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Выбор языка по заголовку Accept-Language браузера */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const prefs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const p of prefs) {
    if (isLocale(p.lang)) return p.lang;
    if (["uk", "be", "kk", "ky", "uz", "tg"].includes(p.lang)) return "ru"; // СНГ и Центральная Азия → русский
  }
  return null;
}
