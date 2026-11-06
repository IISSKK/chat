import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { CatalogHeader, CatalogListing, type SearchParams } from "@/components/catalog/CatalogListing";
import { countBy } from "@/lib/items";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.catalog.titleEngines, description: t.catalog.metaEngines };
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  return (
    <div className="container">
      <CatalogHeader title={t.catalog.titleEngines} subtitle={t.catalog.subtitle} count={countBy({ type: "engine" })} />
      <CatalogListing sp={await searchParams} fixed={{ type: "engine" }} basePath="/catalog/engines" />
    </div>
  );
}
