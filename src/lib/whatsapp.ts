import { siteConfig } from "@/config/site";
import type { Dictionary } from "@/i18n";
import type { Item } from "./types";
import { itemUrl } from "./utils";
import type { Locale } from "@/i18n/config";

export function waLink(text: string, phone = siteConfig.whatsapp) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function itemLines(item: Item, t: Dictionary) {
  const w = t.whatsapp;
  return [
    `${w.model}: ${item.title}${item.year ? ` (${item.year})` : ""}`,
    item.vin && `${w.vin}: ${item.vin}`,
    item.serial && `${w.serial}: ${item.serial}`,
    `${w.link}: ${itemUrl(item, t.meta.code as Locale)}`,
  ].filter(Boolean) as string[];
}

/** Текст «Узнать цену» на языке посетителя */
export function priceMessage(item: Item, t: Dictionary) {
  return [t.whatsapp.priceIntro, ...itemLines(item, t)].join("\n");
}

/** Текст «Документы / Таможня» на языке посетителя */
export function docsMessage(item: Item, t: Dictionary) {
  return [t.whatsapp.docsIntro, ...itemLines(item, t), "", t.whatsapp.docsQuestions].join("\n");
}
