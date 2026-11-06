import type { Metadata } from "next";
import { t } from "@/i18n";
import { CatalogHeader, CatalogListing, type SearchParams } from "@/components/catalog/CatalogListing";
import { countBy } from "@/lib/items";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.catalog.titleEngines, description: `${t.catalog.titleEngines} из Южной Кореи. ${t.catalog.subtitle}` };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="container">
      <CatalogHeader title={t.catalog.titleEngines} subtitle={t.catalog.subtitle} count={countBy({ type: "engine" })} />
      <CatalogListing sp={await searchParams} fixed={{ type: "engine" }} basePath="/catalog/engines" />
    </div>
  );
}
