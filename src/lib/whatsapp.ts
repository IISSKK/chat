import { siteConfig } from "@/config/site";
import type { Dictionary } from "@/i18n";
import type { Item } from "./types";
import { itemUrl } from "./utils";
import type { Locale } from "@/i18n/config";

export function waLink(text: string, phone = siteConfig.whatsapp) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function itemLines(item: Item, t: Dictionary, locale: Locale) {
  const w = t.whatsapp;
  return [
    `${w.model}: ${item.title}${item.year ? ` (${item.year})` : ""}`,
    item.vin && `${w.vin}: ${item.vin}`,
    item.serial && `${w.serial}: ${item.serial}`,
    `${w.link}: ${itemUrl(item, locale)}`,
  ].filter(Boolean) as string[];
}

/** Текст «Узнать цену»: пишется на языке сотрудника (t), ссылка ведёт на страницу на языке покупателя (locale) */
export function priceMessage(item: Item, t: Dictionary, locale: Locale) {
  return [t.whatsapp.priceIntro, ...itemLines(item, t, locale)].join("\n");
}

/** Текст «Документы / Таможня» (см. priceMessage) */
export function docsMessage(item: Item, t: Dictionary, locale: Locale) {
  return [t.whatsapp.docsIntro, ...itemLines(item, t, locale), "", t.whatsapp.docsQuestions].join("\n");
}
