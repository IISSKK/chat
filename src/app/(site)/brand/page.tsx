import type { Metadata } from "next";
import Link from "@/components/site/LocLink";
import { getT } from "@/i18n/server";
import { publicBrandIndex } from "@/lib/catalog-refs";
import { alternatesFor } from "@/lib/seo";
import { fmt } from "@/i18n/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.brandPage.brands, description: t.catalog.metaCars, alternates: await alternatesFor("/brand") };
}

export default async function BrandsIndex() {
  const t = await getT();
  const brands = publicBrandIndex();
  return (
    <div className="container">
      <div className="mb-8 pt-8 sm:pt-12">
        <h1 className="h-display text-3xl sm:text-5xl">{t.brandPage.brands}</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map(({ brand, count, models }) => (
          <div key={brand.id} className="surface rounded-3xl p-5">
            <Link href={`/brand/${brand.slug}`} className="flex items-baseline justify-between gap-2 text-xl font-bold hover:text-brand">
              {brand.name}
              <span className="text-sm font-semibold text-fg/70">{fmt(t.brandPage.count, { n: count })}</span>
            </Link>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {models.slice(0, 10).map(({ model, count: n }) => (
                <Link key={model.id} href={`/brand/${brand.slug}/${model.slug}`} className="chip hover:bg-brand/10 hover:text-brand">
                  {model.name} · {n}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
