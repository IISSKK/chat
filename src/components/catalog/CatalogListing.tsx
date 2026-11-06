import Link from "next/link";
import { Suspense } from "react";
import { t } from "@/i18n";
import { facetValues, listItems } from "@/lib/items";
import { CATEGORIES, FUELS, ITEM_TYPES, STATUSES, TRANSMISSIONS, type Category, type ItemFilters, type ItemType } from "@/lib/types";
import { Filters } from "./Filters";
import { ItemGrid } from "./ItemCard";
import { Pagination } from "./Pagination";

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const pickOne = <T extends string>(v: string | undefined, list: readonly T[]) => (v && (list as readonly string[]).includes(v) ? (v as T) : undefined);

export function parseFilters(sp: SearchParams, fixed: Partial<ItemFilters> = {}) {
  const year = Number(one(sp.year));
  const filters: ItemFilters = {
    type: pickOne(one(sp.type), ITEM_TYPES),
    category: pickOne(one(sp.category), CATEGORIES),
    status: pickOne(one(sp.status), STATUSES),
    brand: one(sp.brand),
    year: Number.isInteger(year) && year > 1900 ? year : undefined,
    fuel: pickOne(one(sp.fuel), FUELS),
    transmission: pickOne(one(sp.transmission), TRANSMISSIONS),
    q: one(sp.q)?.slice(0, 80),
    ...fixed,
  };
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const plain: Record<string, string | undefined> = {};
  for (const k of Object.keys(sp)) plain[k] = one(sp[k]);
  return { filters, page, plain };
}

export function CatalogHeader({ title, subtitle, count }: { title: string; subtitle?: string; count?: number }) {
  return (
    <div className="mb-8 pt-8 sm:pt-12">
      <h1 className="h-display text-3xl sm:text-5xl">
        {title}
        {count !== undefined && <sup className="ml-2 align-super font-sans text-base font-bold text-brand sm:text-xl">{count}</sup>}
      </h1>
      {subtitle && <p className="mt-3 max-w-2xl text-white/60">{subtitle}</p>}
    </div>
  );
}

export function CategoryTabs({ active }: { active?: Category }) {
  const tabs: { href: string; label: string; key?: Category }[] = [
    { href: "/catalog/cars", label: t.common.all },
    ...CATEGORIES.map((c) => ({ href: `/catalog/cars/${c}`, label: t.categoriesLong[c], key: c })),
  ];
  return (
    <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              on ? "bg-white text-ink shadow-lg" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function CatalogListing({
  sp,
  fixed,
  basePath,
  showType = false,
}: {
  sp: SearchParams;
  fixed: Partial<ItemFilters>;
  basePath: string;
  showType?: boolean;
}) {
  const { filters, page, plain } = parseFilters(sp, fixed);
  const { items, total, pages, page: current } = listItems(filters, page, 12);
  const facets = facetValues(filters);

  return (
    <>
      <Suspense>
        <Filters brands={facets.brands} years={facets.years} showType={showType} />
      </Suspense>
      <p className="mb-5 mt-6 text-sm text-white/50">
        {t.common.found}: <b className="text-white">{total}</b>
      </p>
      {items.length ? (
        <ItemGrid items={items} />
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center">
          <div className="mb-3 text-5xl">🔍</div>
          <p className="font-display text-xl font-bold">{t.common.noResults}</p>
          <p className="mt-2 text-sm text-white/50">{t.common.noResultsHint}</p>
        </div>
      )}
      <Pagination page={current} pages={pages} basePath={basePath} params={plain} />
    </>
  );
}
