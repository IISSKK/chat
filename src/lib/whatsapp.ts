import { siteConfig } from "@/config/site";
import { t } from "@/i18n";
import type { Item } from "./types";
import { itemUrl } from "./utils";

export function waLink(text: string, phone = siteConfig.whatsapp) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function itemLines(item: Item) {
  const w = t.whatsapp;
  return [
    `${w.model}: ${item.title}${item.year ? ` (${item.year})` : ""}`,
    item.vin && `${w.vin}: ${item.vin}`,
    item.serial && `${w.serial}: ${item.serial}`,
    `${w.link}: ${itemUrl(item)}`,
  ].filter(Boolean) as string[];
}

export function priceMessage(item: Item) {
  return [t.whatsapp.priceIntro, ...itemLines(item)].join("\n");
}

export function docsMessage(item: Item) {
  return [t.whatsapp.docsIntro, ...itemLines(item), "", t.whatsapp.docsQuestions].join("\n");
}
