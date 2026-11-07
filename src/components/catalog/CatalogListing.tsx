import Link from "@/components/site/LocLink";
import { Suspense } from "react";
import { getLocale, getT } from "@/i18n/server";
import { facetValues, listItems } from "@/lib/items";
import { generationsOf, getGeneration } from "@/lib/catalog-refs";
import { CATEGORIES, FUELS, ITEM_TYPES, PUBLIC_STATUSES, TRANSMISSIONS, type Category, type ItemFilters } from "@/lib/types";
import { Filters } from "./Filters";
import { ItemGrid } from "./ItemCard";
import { Pagination } from "./Pagination";

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const pickOne = <T extends string>(v: string | undefined, list: readonly T[]) => (v && (list as readonly string[]).includes(v) ? (v as T) : undefined);

export function parseFilters(sp: SearchParams, fixed: Partial<ItemFilters> = {}) {
  const year = Number(one(sp.year));
  const yearOf = (v: string | undefined) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1950 && n <= 2100 ? n : undefined;
  };
  let yearFrom = yearOf(one(sp.yearFrom));
  let yearTo = yearOf(one(sp.yearTo));
  if (yearFrom && yearTo && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom];
  const genId = Number(one(sp.gen));
  const gen = Number.isInteger(genId) && genId > 0 ? getGeneration(genId) : null;
  const filters: ItemFilters = {
    type: pickOne(one(sp.type), ITEM_TYPES),
    category: pickOne(one(sp.category), CATEGORIES),
    status: pickOne(one(sp.status), PUBLIC_STATUSES),
    brand: gen?.brand ?? one(sp.brand),
    model: gen?.model ?? one(sp.model),
    yearFrom: gen?.year_from ?? yearFrom,
    yearTo: gen?.year_to ?? yearTo,
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

export async function CatalogHeader({ title, subtitle, count }: { title: string; subtitle?: string; count?: number }) {
  return (
    <div className="mb-8 pt-8 sm:pt-12">
      <h1 className="h-display text-3xl sm:text-5xl">
        {title}
        {count !== undefined && <sup className="ml-2 align-super font-sans text-base font-bold text-brand sm:text-xl">{count}</sup>}
      </h1>
      {subtitle && <p className="mt-3 max-w-2xl text-fg/70">{subtitle}</p>}
    </div>
  );
}

export async function CategoryTabs({ active }: { active?: Category }) {
  const t = await getT();
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
              on ? "bg-fg text-white shadow-lg" : "bg-fg/[0.06] text-fg/70 hover:bg-fg/[0.12] hover:text-fg"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export async function CatalogListing({
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
  const t = await getT();
  const { filters, page, plain } = parseFilters(sp, fixed);
  const locale = await getLocale();
  const { items, total, pages, page: current } = listItems(filters, page, 12, locale);
  const facets = facetValues(filters);

  return (
    <>
      <Suspense>
        <Filters
          brands={facets.brands}
          years={facets.years}
          models={facets.models}
          generations={filters.brand && filters.model ? generationsOf(filters.brand, filters.model) : []}
          lockBrand={!!fixed.brand}
          lockModel={!!fixed.model}
          showType={showType}
        />
      </Suspense>
      <p className="mb-5 mt-6 text-sm text-fg/62">
        {t.common.found}: <b className="text-fg">{total}</b>
      </p>
      {items.length ? (
        <ItemGrid items={items} />
      ) : (
        <div className="rounded-3xl border border-dashed border-fg/10 py-20 text-center">
          <div className="mb-3 text-5xl">🔍</div>
          <p className="font-display text-xl font-bold">{t.common.noResults}</p>
          <p className="mt-2 text-sm text-fg/62">{t.common.noResultsHint}</p>
        </div>
      )}
      <Pagination page={current} pages={pages} basePath={basePath} params={plain} />
    </>
  );
}
