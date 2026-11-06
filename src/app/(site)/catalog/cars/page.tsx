import type { Metadata } from "next";
import { t } from "@/i18n";
import { CatalogHeader, CatalogListing, CategoryTabs, type SearchParams } from "@/components/catalog/CatalogListing";
import { countBy } from "@/lib/items";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.catalog.titleCars, description: `${t.catalog.titleCars} из Южной Кореи. ${t.catalog.subtitle}` };

export default async function CarsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return (
    <div className="container">
      <CatalogHeader title={t.catalog.titleCars} subtitle={t.catalog.subtitle} count={countBy({ type: "car" })} />
      <CategoryTabs />
      <CatalogListing sp={sp} fixed={{ type: "car" }} basePath="/catalog/cars" />
    </div>
  );
}
