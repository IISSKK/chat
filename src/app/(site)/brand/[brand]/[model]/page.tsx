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
type Props = { params: Promise<{ brand: string; model: string }>; searchParams: Promise<SearchParams> };

function find(brandSlug: string, modelSlug: string) {
  const brand = getBrandBySlug(brandSlug);
  const model = brand?.models.find((m) => m.slug === modelSlug);
  return brand && model ? { brand, model } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const f = find(p.brand, p.model);
  const t = await getT();
  if (!f) return { title: t.item.notFound, robots: { index: false } };
  const n = countBy({ type: "car", brand: f.brand.name, model: f.model.name });
  const v = { brand: f.brand.name, model: f.model.name };
  return {
    title: fmt(t.brandPage.metaTitleModel, v),
    description: fmt(t.brandPage.introModel, v).slice(0, 200),
    robots: n ? undefined : { index: false, follow: true },
    alternates: await alternatesFor(`/brand/${f.brand.slug}/${f.model.slug}`),
  };
}

export default async function ModelPage({ params, searchParams }: Props) {
  const p = await params;
  const f = find(p.brand, p.model);
  if (!f) notFound();
  const t = await getT();
  const locale = await getLocale();
  const sp = await searchParams;
  const v = { brand: f.brand.name, model: f.model.name };
  const count = countBy({ type: "car", brand: f.brand.name, model: f.model.name });
  const idx = publicBrandIndex().find((b) => b.brand.id === f.brand.id);
  const models = (idx?.models ?? []).map((m) => ({ slug: m.model.slug, name: m.model.name, count: m.count }));
  const first = listItems({ type: "car", brand: f.brand.name, model: f.model.name }, 1, 24, locale).items;

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: t.types.car, item: absoluteUrl(locale, "/catalog/cars") },
      { "@type": "ListItem", position: 2, name: f.brand.name, item: absoluteUrl(locale, `/brand/${f.brand.slug}`) },
      { "@type": "ListItem", position: 3, name: f.model.name, item: absoluteUrl(locale, `/brand/${f.brand.slug}/${f.model.slug}`) },
    ] },
    { "@context": "https://schema.org", "@type": "ItemList", name: fmt(t.brandPage.h1Model, v), itemListElement: first.map((i, n) => ({ "@type": "ListItem", position: n + 1, url: itemUrl(i, locale), name: i.title })) },
  ];

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <BrandHeader t={t} h1={fmt(t.brandPage.h1Model, v)} intro={fmt(t.brandPage.introModel, v)} brandSlug={f.brand.slug} brandName={f.brand.name} models={models} activeModel={f.model.slug} count={count} />
      {count > 0 && <CatalogListing sp={sp} fixed={{ type: "car", brand: f.brand.name, model: f.model.name }} basePath={`/brand/${f.brand.slug}/${f.model.slug}`} />}
    </div>
  );
}
