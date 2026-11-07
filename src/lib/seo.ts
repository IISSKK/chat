import "server-only";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LOCALES, localePath, type Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

/** Абсолютный адрес страницы в нужном языке */
export function absoluteUrl(locale: Locale, path: string) {
  const p = localePath(locale, path);
  return `${siteConfig.url}${p === "/" ? "" : p}` || siteConfig.url;
}

const HREFLANG: Record<Locale, string> = { ru: "ru", en: "en", ko: "ko", zh: "zh-CN" };

/** hreflang-ссылки на все языковые версии страницы: поисковики показывают каждому человеку его язык. */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = absoluteUrl(l, path);
  languages["x-default"] = absoluteUrl("ru", path);
  return languages;
}

/** canonical + hreflang для metadata.alternates (path — без префикса языка, например "/catalog/cars") */
export async function alternatesFor(path: string): Promise<NonNullable<Metadata["alternates"]>> {
  const locale = await getLocale();
  return { canonical: absoluteUrl(locale, path), languages: languageAlternates(path) };
}

export const OG_LOCALE: Record<Locale, string> = { ru: "ru_RU", en: "en_US", ko: "ko_KR", zh: "zh_CN" };
export const OG_ALTERNATE_LOCALES = (current: Locale) => LOCALES.filter((l) => l !== current).map((l) => OG_LOCALE[l]);

/** JSON для <script type="application/ld+json">: экранируем <, >, &, иначе "</script>" в тексте ломает страницу (XSS). */
export function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
