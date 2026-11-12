import { siteConfig } from "@/config/site";
import { localePath, type Locale } from "@/i18n/config";
import type { Item, ItemType } from "./types";

const translit: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ы: "y",
  э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((c) => translit[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

export function itemPath(item: Pick<Item, "id" | "slug">) {
  return `/item/${item.id}-${item.slug}`;
}

/** Полная ссылка на объявление в языке посетителя (для WhatsApp, «Поделиться», SEO) */
export function itemUrl(item: Pick<Item, "id" | "slug">, locale: Locale = "ru") {
  return `${siteConfig.url}${localePath(locale, itemPath(item))}`;
}

/** URL фото. size "sm" — уменьшенная копия (~640px) для списков и карточек: быстрее грузится на телефоне. */
/** Фото в трёх размерах: «sm» (640 px) для списков на телефоне, «md» (1000 px) для планшетов и Retina, полное (1600 px). srcSet даёт браузеру выбрать нужное */
export function photoSet(filename: string) {
  const full = photoUrl(filename);
  const sm = photoUrl(filename, "sm");
  const md = photoUrl(filename, "md");
  return { full, sm, md, srcSet: full !== sm ? `${sm} 640w, ${md} 1000w, ${full} 1600w` : undefined };
}

export function photoUrl(filename: string, size: "full" | "sm" | "md" = "full") {
  if (/^https?:\/\//.test(filename)) return filename;
  if (filename.startsWith("demo/")) return `/${filename}`;
  if (size === "sm" || size === "md") return `/media/${filename.replace(/\.(\w+)$/, `_${size}.$1`)}`;
  return `/media/${filename}`;
}

export function typePath(type: ItemType) {
  return type === "car" ? "/catalog/cars" : "/catalog/engines";
}

export function formatNumber(n: number | null | undefined, intl = "ru-RU") {
  if (n === null || n === undefined) return "";
  return new Intl.NumberFormat(intl).format(n);
}

export function parseIdFromParam(param: string): number | null {
  const m = /^(\d+)/.exec(param);
  return m ? Number(m[1]) : null;
}
