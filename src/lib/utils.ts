import { siteConfig } from "@/config/site";
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

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function itemPath(item: Pick<Item, "id" | "slug">) {
  return `/item/${item.id}-${item.slug}`;
}

export function itemUrl(item: Pick<Item, "id" | "slug">) {
  return `${siteConfig.url}${itemPath(item)}`;
}

export function photoUrl(filename: string) {
  if (/^https?:\/\//.test(filename)) return filename;
  if (filename.startsWith("demo/")) return `/${filename}`;
  return `/media/${filename}`;
}

export function typePath(type: ItemType) {
  return type === "car" ? "/catalog/cars" : type === "engine" ? "/catalog/engines" : "/catalog/parts";
}

export function formatNumber(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  return new Intl.NumberFormat("ru-RU").format(n);
}

export function parseIdFromParam(param: string): number | null {
  const m = /^(\d+)/.exec(param);
  return m ? Number(m[1]) : null;
}
