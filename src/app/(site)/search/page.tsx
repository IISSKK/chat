import type { Metadata } from "next";
import { t } from "@/i18n";
import { CatalogHeader, CatalogListing, type SearchParams } from "@/components/catalog/CatalogListing";
import { SearchBox } from "@/components/site/SearchBox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.search.title, robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) || "";
  return (
    <div className="container">
      <CatalogHeader title={t.search.title} subtitle={q ? `${t.search.for} «${q}»` : t.search.hint} />
      <div className="mb-6 max-w-2xl">
        <SearchBox key={q} defaultValue={q} size="lg" />
      </div>
      <CatalogListing sp={sp} fixed={{}} basePath="/search" showType />
    </div>
  );
}
