import ru, { type Dictionary } from "./dictionaries/ru";
import en from "./dictionaries/en";
import ko from "./dictionaries/ko";
import zh from "./dictionaries/zh";
import { DEFAULT_LOCALE, type Locale } from "./config";

/** Все словари интерфейса. Тексты переводов — в src/i18n/dictionaries/*.ts */
export const dictionaries: Record<Locale, Dictionary> = { ru, en, ko, zh };

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? ru;
}

export type { Dictionary, Locale };
export { fmt, plural, formatNum } from "./format";
