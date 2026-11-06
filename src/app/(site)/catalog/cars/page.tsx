import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { CatalogHeader, CatalogListing, CategoryTabs, type SearchParams } from "@/components/catalog/CatalogListing";
import { countBy } from "@/lib/items";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.catalog.titleCars, description: t.catalog.metaCars };
}

export default async function CarsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  const sp = await searchParams;
  return (
    <div className="container">
      <CatalogHeader title={t.catalog.titleCars} subtitle={t.catalog.subtitle} count={countBy({ type: "car" })} />
      <CategoryTabs />
      <CatalogListing sp={sp} fixed={{ type: "car" }} basePath="/catalog/cars" />
    </div>
  );
}
