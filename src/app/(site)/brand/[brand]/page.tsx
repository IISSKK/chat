import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT, getLocale } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { getBrandBySlug, publicBrandIndex } from "@/lib/catalog-refs";
import { countBy, listItems } from "@/lib/items";
import { absoluteUrl, alternatesFor, safeJsonLd } from "@/lib/seo";
import { itemUrl } from "@/lib/utils";
import { BrandHeader } from "@/components/catalog/BrandHeader";
import { CatalogListing, type SearchParams } from "@/components/catalog/CatalogListing";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ brand: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = getBrandBySlug((await params).brand);
  const t = await getT();
  if (!brand) return { title: t.item.notFound, robots: { index: false } };
  const n = countBy({ type: "car", brand: brand.name });
  return {
    title: fmt(t.brandPage.metaTitle, { brand: brand.name }),
    description: fmt(t.brandPage.intro, { brand: brand.name }).slice(0, 200),
    robots: n ? undefined : { index: false, follow: true }, // страница без объявлений не индексируется
    alternates: await alternatesFor(`/brand/${brand.slug}`),
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const brand = getBrandBySlug((await params).brand);
  if (!brand) notFound();
  const t = await getT();
  const locale = await getLocale();
  const sp = await searchParams;
  const count = countBy({ type: "car", brand: brand.name });
  const idx = publicBrandIndex().find((b) => b.brand.id === brand.id);
  const models = (idx?.models ?? []).map((m) => ({ slug: m.model.slug, name: m.model.name, count: m.count }));
  const first = listItems({ type: "car", brand: brand.name }, 1, 24, locale).items;

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: t.types.car, item: absoluteUrl(locale, "/catalog/cars") },
      { "@type": "ListItem", position: 2, name: brand.name, item: absoluteUrl(locale, `/brand/${brand.slug}`) },
    ] },
    { "@context": "https://schema.org", "@type": "ItemList", name: fmt(t.brandPage.h1, { brand: brand.name }), itemListElement: first.map((i, n) => ({ "@type": "ListItem", position: n + 1, url: itemUrl(i, locale), name: i.title })) },
  ];

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <BrandHeader t={t} h1={fmt(t.brandPage.h1, { brand: brand.name })} intro={fmt(t.brandPage.intro, { brand: brand.name })} brandSlug={brand.slug} brandName={brand.name} models={models} count={count} />
      {count > 0 && <CatalogListing sp={sp} fixed={{ type: "car", brand: brand.name }} basePath={`/brand/${brand.slug}`} />}
    </div>
  );
}
