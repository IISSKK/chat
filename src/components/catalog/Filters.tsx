"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { FilterIcon } from "@/components/icons";
import ru from "@/i18n/dictionaries/ru";
import { FUELS, TRANSMISSIONS } from "@/lib/types";

export function Filters({ brands, years, showType = false }: { brands: string[]; years: number[]; showType?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
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
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/40">{label}</span>
      <select className="select" value={params.get(key) ?? ""} onChange={(e) => set(key, e.target.value)}>
        <option value="">{ru.common.any}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost w-full justify-between md:hidden" aria-expanded={open}>
        <span className="flex items-center gap-2"><FilterIcon className="h-4 w-4" /> {ru.common.filters}</span>
        {active > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-ink">{active}</span>}
      </button>
      <div
        className={`${open ? "mt-3 grid animate-fade-up" : "hidden"} gap-3 rounded-3xl border border-white/[0.07] bg-ink-800/70 p-4 backdrop-blur-xl md:mt-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:items-end`}
      >
        {showType &&
          field("type", "Раздел", [
            ["car", ru.types.car],
            ["engine", ru.types.engine],
            ["part", ru.types.part],
          ])}
        {field("brand", ru.fields.brand, brands.map((b) => [b, b]))}
        {field("year", ru.fields.year, years.map((y) => [String(y), String(y)]))}
        {field("fuel", ru.fields.fuel, FUELS.map((f) => [f, ru.fuel[f]]))}
        {field("transmission", ru.fields.transmission, TRANSMISSIONS.map((f) => [f, ru.transmission[f]]))}
        {field("status", ru.fields.status, [
          ["available", ru.status.available],
          ["sold", "Продано"],
        ])}
        <button onClick={reset} disabled={!active} className="btn-ghost h-[46px]">
          {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : ru.common.reset}
        </button>
      </div>
    </div>
  );
}
