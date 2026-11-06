import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { CatalogHeader, CatalogListing, type SearchParams } from "@/components/catalog/CatalogListing";
import { SearchBox } from "@/components/site/SearchBox";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.search.title, robots: { index: false } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getT();
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) || "";
  return (
    <div className="container">
      <CatalogHeader title={t.search.title} subtitle={q ? fmt(t.search.for, { q }) : t.search.hint} />
      <div className="mb-6 max-w-2xl">
        <SearchBox key={q} defaultValue={q} size="lg" />
      </div>
      <CatalogListing sp={sp} fixed={{}} basePath="/search" showType />
    </div>
  );
}
