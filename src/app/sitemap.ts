import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listItems } from "@/lib/items";
import { itemPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const pages = ["", "/catalog/cars", "/catalog/cars/standby", "/catalog/cars/listing", "/catalog/cars/running", "/catalog/engines", "/catalog/parts", "/about", "/terms", "/privacy"];
  const items = listItems({}, 1, 5000).items;
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const })),
    ...items.map((i) => ({ url: `${base}${itemPath(i)}`, lastModified: new Date(i.updated_at.replace(" ", "T") + "Z") })),
  ];
}
