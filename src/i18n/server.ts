import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, matchAcceptLanguage, type Locale } from "./config";
import { getDictionary } from "./index";

/**
 * Язык текущего запроса:
 *  1) из адреса страницы (/en, /ko, /zh — middleware кладёт его в заголовок);
 *  2) для /api/* — cookie выбора языка → язык браузера → русский.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const h = await headers();
  const fromUrl = h.get(LOCALE_HEADER);
  if (isLocale(fromUrl)) return fromUrl;
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return matchAcceptLanguage(h.get("accept-language")) ?? DEFAULT_LOCALE;
});

/** Словарь текущего запроса (для серверных компонентов и метаданных). */
export const getT = cache(async () => getDictionary(await getLocale()));
