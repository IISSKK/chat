import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, matchAcceptLanguage, type Locale } from "./config";
import { getDictionary } from "./index";

/** Язык текущего запроса: выбор посетителя (cookie) → язык браузера → русский по умолчанию. */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return matchAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
});

/** Словарь текущего запроса (для серверных компонентов и метаданных). */
export const getT = cache(async () => getDictionary(await getLocale()));
