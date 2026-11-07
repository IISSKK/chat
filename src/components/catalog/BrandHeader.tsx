import Link from "@/components/site/LocLink";
import type { Dictionary } from "@/i18n";
import { LeadButton } from "@/components/site/LeadModal";

/** Заголовок страницы марки или модели: H1, описание, навигация по моделям и кнопка заявки */
export function BrandHeader({
  t,
  h1,
  intro,
  brandSlug,
  brandName,
  models,
  activeModel,
  count,
}: {
  t: Dictionary;
  h1: string;
  intro: string;
  brandSlug: string;
  brandName: string;
  models: { slug: string; name: string; count: number }[];
  activeModel?: string;
  count: number;
}) {
  return (
    <div className="mb-8 pt-8 sm:pt-12">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-fg/62" aria-label="breadcrumb">
        <Link href="/catalog/cars" className="hover:text-fg">{t.types.car}</Link>
        <span>/</span>
        <Link href="/brand" className="hover:text-fg">{t.brandPage.brands}</Link>
        <span>/</span>
        {activeModel ? <Link href={`/brand/${brandSlug}`} className="hover:text-fg">{brandName}</Link> : <span className="font-semibold text-fg">{brandName}</span>}
      </nav>
      <h1 className="h-display text-3xl sm:text-5xl">
        {h1}
        <sup className="ml-2 align-super font-sans text-base font-bold text-brand sm:text-xl">{count}</sup>
      </h1>
      <p className="mt-3 max-w-3xl text-fg/70">{intro}</p>
      {models.length > 0 && (
        <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href={`/brand/${brandSlug}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${!activeModel ? "bg-fg text-white" : "bg-white/70 text-fg/70 ring-1 ring-fg/10 hover:bg-white"}`}>{t.common.all}</Link>
          {models.map((m) => (
            <Link key={m.slug} href={`/brand/${brandSlug}/${m.slug}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeModel === m.slug ? "bg-fg text-white" : "bg-white/70 text-fg/70 ring-1 ring-fg/10 hover:bg-white"}`}>
              {m.name} <span className="opacity-50">{m.count}</span>
            </Link>
          ))}
        </div>
      )}
      {count === 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-brand/10 p-4">
          <p className="min-w-0 flex-1 text-sm text-fg/70">{t.brandPage.noItems}</p>
          <LeadButton className="btn-brand px-6 py-3" />
        </div>
      )}
    </div>
  );
}
