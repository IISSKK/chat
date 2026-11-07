"use client";

import { Select } from "@/components/ui/Select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { FilterIcon } from "@/components/icons";
import { useLocale, useT } from "@/i18n/client";
import { localePath, stripLocale } from "@/i18n/config";
import { FUELS, TRANSMISSIONS } from "@/lib/types";

export function Filters({ brands, years, showType = false }: { brands: string[]; years: number[]; showType?: boolean }) {
  const router = useRouter();
  const ru = useT();
  const rawPathname = usePathname();
  const locale = useLocale();
  // usePathname может вернуть как адрес с префиксом языка, так и без — нормализуем
  const pathname = localePath(locale, stripLocale(rawPathname).path);
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const active = ["brand", "year", "fuel", "transmission", "type", "status"].filter((k) => params.get(k)).length;

  const reset = () => {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const field = (key: string, label: string, options: [string, string][]) => (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-fg/40">{label}</span>
      <Select value={params.get(key) ?? ""} onChange={(v) => set(key, v)} aria-label={label} placeholder={ru.common.any} searchPlaceholder={ru.common.searchList} options={[{ value: "", label: ru.common.any }, ...options.map(([value, label]) => ({ value, label }))]} />
    </label>
  );

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost w-full justify-between md:hidden" aria-expanded={open}>
        <span className="flex items-center gap-2"><FilterIcon className="h-4 w-4" /> {ru.common.filters}</span>
        {active > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">{active}</span>}
      </button>
      <div
        className={`${open ? "mt-3 grid animate-fade-up" : "hidden"} gap-3 rounded-3xl surface p-4 md:mt-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:items-end`}
      >
        {showType &&
          field("type", ru.fields.section, [
            ["car", ru.types.car],
            ["engine", ru.types.engine],
          ])}
        {field("brand", ru.fields.brand, brands.map((b) => [b, b]))}
        {field("year", ru.fields.year, years.map((y) => [String(y), String(y)]))}
        {field("fuel", ru.fields.fuel, FUELS.map((f) => [f, ru.fuel[f]]))}
        {field("transmission", ru.fields.transmission, TRANSMISSIONS.map((f) => [f, ru.transmission[f]]))}
        {field("status", ru.fields.status, [
          ["available", ru.status.available],
          ["sold", ru.status.soldShort],
        ])}
        <button onClick={reset} disabled={!active} className="btn-ghost h-[46px]">
          {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-fg/30 border-t-fg" /> : ru.common.reset}
        </button>
      </div>
    </div>
  );
}
