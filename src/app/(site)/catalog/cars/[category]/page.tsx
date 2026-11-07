import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { CatalogHeader, CatalogListing, CategoryTabs, type SearchParams } from "@/components/catalog/CatalogListing";
import { CATEGORIES, type Category } from "@/lib/types";
import { countBy } from "@/lib/items";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!CATEGORIES.includes(category as Category)) return {};
  const t = await getT();
  return { title: t.categoriesLong[category as Category], alternates: await alternatesFor(`/catalog/cars/${category}`) };
}

export default async function CarsCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (!CATEGORIES.includes(category as Category)) notFound();
  const t = await getT();
  const c = category as Category;
  return (
    <div className="container">
      <CatalogHeader title={t.categoriesLong[c]} subtitle={t.catalog.subtitle} count={countBy({ type: "car", category: c })} />
      <CategoryTabs active={c} />
      <CatalogListing sp={await searchParams} fixed={{ type: "car", category: c }} basePath={`/catalog/cars/${c}`} />
    </div>
  );
}
