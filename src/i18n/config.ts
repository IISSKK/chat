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

/** Названия языков по-русски: для сотрудников, которые отвечают клиентам (WhatsApp, заявки, Telegram) */
export const LANG_NAME_RU: Record<Locale, string> = { ru: "русский", en: "английский", ko: "корейский", zh: "китайский" };

/** «English (английский)»: язык, который выбрал покупатель, и как это сказать по-русски */
export function clientLangLabel(locale: string): string {
  if (!isLocale(locale)) return "";
  return locale === "ru" ? "Русский" : `${LOCALE_INFO[locale].native} (${LANG_NAME_RU[locale]})`;
}

/** Строка в конце сообщения в WhatsApp: на каком языке отвечать покупателю */
export function waLangLine(locale: string): string {
  const label = clientLangLabel(locale);
  return label ? `🌐 Язык клиента: ${label}${locale === "ru" ? "" : ". Ответьте, пожалуйста, на этом языке"}` : "";
}

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

/** Заголовок, в котором middleware передаёт язык страницы (определён по префиксу URL) */
export const LOCALE_HEADER = "x-bk-locale";

/** Язык по умолчанию живёт без префикса (/…), остальные — с префиксом (/en/…, /ko/…, /zh/…) */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const m = /^\/(en|ko|zh|ru)(?=\/|$)/.exec(pathname);
  if (!m) return { locale: DEFAULT_LOCALE, path: pathname || "/" };
  return { locale: m[1] as Locale, path: pathname.slice(m[0].length) || "/" };
}

/** Добавляет префикс языка к внутренней ссылке. Внешние, якорные, mailto и служебные (/api, /media…) не трогает. */
export function localePath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (/^\/(api|media|demo|guides|_next|admin|icons)(\/|$)/.test(href) || /^\/(en|ko|zh)(\/|$|\?|#)/.test(href)) return href;
  if (locale === DEFAULT_LOCALE) return href;
  if (href === "/") return `/${locale}`;
  if (href.startsWith("/#") || href.startsWith("/?")) return `/${locale}${href.slice(1)}`; // /#contacts → /en#contacts
  return `/${locale}${href}`;
}
