import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";
import { publicBrandIndex } from "@/lib/catalog-refs";
import { listItems } from "@/lib/items";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { itemPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Карта сайта: каждая страница — во всех языках, с ссылками hreflang между версиями */
export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  const add = (path: string, opts: { lastModified?: Date; changeFrequency?: "daily" | "weekly" | "monthly"; priority?: number } = {}) => {
    const languages = languageAlternates(path);
    for (const l of LOCALES) out.push({ url: absoluteUrl(l, path), ...opts, alternates: { languages } });
  };

  const fixed: [string, number, "daily" | "weekly" | "monthly"][] = [
    ["/", 1, "daily"], ["/catalog/cars", 0.9, "daily"], ["/catalog/cars/standby", 0.8, "daily"], ["/catalog/cars/listing", 0.8, "daily"],
    ["/catalog/cars/running", 0.8, "daily"], ["/catalog/engines", 0.9, "daily"], ["/brand", 0.7, "weekly"], ["/parts", 0.7, "monthly"], ["/about", 0.5, "monthly"],
    ["/terms", 0.2, "monthly"], ["/privacy", 0.2, "monthly"],
  ];
  for (const [p, priority, changeFrequency] of fixed) add(p, { priority, changeFrequency });

  for (const { brand, models } of publicBrandIndex()) {
    add(`/brand/${brand.slug}`, { priority: 0.7, changeFrequency: "daily" });
    for (const { model } of models) add(`/brand/${brand.slug}/${model.slug}`, { priority: 0.6, changeFrequency: "daily" });
  }

  for (const i of listItems({}, 1, 5000).items) add(itemPath(i), { lastModified: new Date(i.updated_at.replace(" ", "T") + "Z"), priority: i.status === "sold" ? 0.3 : 0.6, changeFrequency: "weekly" });
  return out;
}
