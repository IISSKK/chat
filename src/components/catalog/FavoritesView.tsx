"use client";

import { useEffect, useMemo, useState } from "react";
import LocLink from "@/components/site/LocLink";
import { WaButton, type WaOption } from "@/components/site/WaButton";
import { WhatsAppIcon, HeartIcon, CompareIcon, TrashIcon } from "@/components/icons";
import { useLocale, useT } from "@/i18n/client";
import { localePath, waLangLine, type Locale } from "@/i18n/config";
import { clearFavorites, toggleFavorite, useFavorites } from "@/lib/favorites-client";
import { formatNumber, itemPath, photoUrl } from "@/lib/utils";
import type { Item } from "@/lib/types";
import { ItemCardView } from "./ItemCardView";

type Contact = { name: string; phone: string; langs: string; digits: string };

/** «Избранное» и сравнение. Данные берутся из браузера (localStorage) и актуализируются через /api/favorites. */
export function FavoritesView() {
  const t = useT();
  const locale = useLocale() as Locale;
  const { ids } = useFavorites();
  const [items, setItems] = useState<Item[] | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mode, setMode] = useState<"list" | "compare">("list");
  const [picked, setPicked] = useState<number[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) return setItems([]);
    let alive = true;
    fetch(`/api/favorites?ids=${key}&l=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        // сохраняем порядок избранного (новые сверху)
        const byId = new Map<number, Item>((d.items as Item[]).map((i) => [i.id, i]));
        setItems(ids.map((id) => byId.get(id)).filter((i): i is Item => !!i));
        setContacts(d.contacts.map((c: Contact) => ({ ...c, digits: String(c.digits ?? c.phone).replace(/\D/g, "") })));
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [key, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const waOpts = (kind: "price" | "docs", id: number): WaOption[] =>
    (contacts.length ? contacts : [{ name: "", phone: "", langs: "", digits: "" }]).map((c, n) => ({ name: c.name, phone: c.phone, langs: c.langs, href: `/api/wa?kind=${kind}&id=${id}&n=${n}&l=${locale}` }));

  const listMessage = useMemo(() => {
    if (!items?.length) return "";
    return ["Здравствуйте! Меня интересуют эти позиции:", ...items.map((i) => `• ${i.title}${i.year ? ` (${i.year})` : ""} — ${origin}${localePath(locale, itemPath(i))}`), "", waLangLine(locale)].join("\n");
  }, [items, t, origin, locale]);
  const sendOptions: WaOption[] = contacts.map((c) => ({ name: c.name, phone: c.phone, langs: c.langs, href: `https://wa.me/${c.digits}?text=${encodeURIComponent(listMessage)}` }));

  if (items === null) {
    return <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="img-skeleton h-72 rounded-[26px]" />)}</div>;
  }

  if (!items.length) {
    return (
      <div className="rounded-[32px] border border-dashed border-fg/15 py-20 text-center">
        <HeartIcon className="mx-auto mb-4 h-12 w-12 text-fg/25" />
        <p className="text-xl font-bold">{t.fav.empty}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg/76">{t.fav.emptyHint}</p>
        <LocLink href="/catalog/cars" className="btn-brand mt-6">{t.fav.browse}</LocLink>
      </div>
    );
  }

  const togglePick = (id: number) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]));
  const cmp = items.filter((i) => picked.includes(i.id));
  const rows: [string, (i: Item) => string][] = [
    [t.fields.brand, (i) => i.brand],
    [t.fields.model, (i) => i.model],
    [t.fields.year, (i) => (i.year ? String(i.year) : "")],
    [t.fields.mileage, (i) => (i.mileage !== null ? `${formatNumber(i.mileage, t.meta.intl)} ${t.units.km}` : "")],
    [t.fields.fuel, (i) => t.fuel[i.fuel as keyof typeof t.fuel] ?? i.fuel],
    [t.fields.transmission, (i) => t.transmission[i.transmission as keyof typeof t.transmission] ?? i.transmission],
    [t.fields.displacement, (i) => (i.displacement ? `${formatNumber(i.displacement, t.meta.intl)} ${t.units.cc}` : "")],
    [t.fields.engineCode, (i) => i.engine_code],
    [t.fields.vin, (i) => i.vin],
    [t.fields.firstRegistration, (i) => i.first_registration],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-fg/[0.09] p-1">
          {(["list", "compare"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`press rounded-full px-4 py-2 text-sm font-semibold ${mode === m ? "bg-white text-fg shadow-sm" : "text-fg/76"}`}>
              {m === "list" ? t.fav.list : <span className="inline-flex items-center gap-1.5"><CompareIcon className="h-4 w-4" />{t.fav.compare}</span>}
            </button>
          ))}
        </div>
        <span className="text-sm text-fg/72">{t.fav.count}: <b className="text-fg">{items.length}</b></span>
        <div className="ml-auto flex flex-wrap gap-2">
          {sendOptions.length > 0 && (
            <WaButton chooseLabel={t.whatsapp.choose} options={sendOptions} placement="down" align="right" className="btn-wa px-5 py-2.5" wrapperClassName="inline-block">
              <WhatsAppIcon className="h-4 w-4" /> {t.fav.sendWhatsapp}
            </WaButton>
          )}
          <button onClick={() => { clearFavorites(); setPicked([]); }} className="btn-ghost px-4 py-2.5"><TrashIcon className="h-4 w-4" /> {t.fav.clear}</button>
        </div>
      </div>

      {mode === "list" ? (
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((it, i) => (
            <ItemCardView key={it.id} item={it} t={t} index={i} origin={origin} price={waOpts("price", it.id)} docs={waOpts("docs", it.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-fg/76">{cmp.length < 2 ? t.fav.compareNeed : t.fav.compareHint}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((i) => {
              const on = picked.includes(i.id);
              return (
                <button key={i.id} onClick={() => togglePick(i.id)} disabled={!on && picked.length >= 4} className={`press flex max-w-full items-center gap-2 rounded-2xl p-1.5 pr-3 text-left text-sm font-semibold ring-1 transition ${on ? "bg-brand/10 ring-brand/50" : "bg-white/70 ring-fg/10 disabled:opacity-40"}`}>
                  <span className="h-10 w-12 shrink-0 overflow-hidden rounded-xl bg-fg/10">
                    {i.photos[0] && <img src={photoUrl(i.photos[0].filename, "sm")} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="truncate">{i.title}</span>
                </button>
              );
            })}
          </div>
          {cmp.length >= 2 && (
            <div className="surface overflow-x-auto rounded-3xl">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-fg/[0.06] text-left">
                    <th className="sticky left-0 w-32 bg-white/90 px-4 py-3 text-xs font-bold uppercase tracking-wider text-fg/68">{t.fav.spec}</th>
                    {cmp.map((i) => (
                      <th key={i.id} className="min-w-[160px] px-4 py-3 align-top">
                        <LocLink href={itemPath(i)} className="font-bold hover:text-brand">{i.title}</LocLink>
                        <button onClick={() => toggleFavorite(i.id)} className="mt-1 block text-xs font-normal text-fg/68 hover:text-flame">{t.fav.remove}</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, get]) => {
                    const vals = cmp.map(get);
                    if (vals.every((v) => !v)) return null;
                    const differ = new Set(vals).size > 1;
                    return (
                      <tr key={label} className="border-b border-fg/[0.05] last:border-0">
                        <td className="sticky left-0 bg-white/90 px-4 py-2.5 text-fg/72">{label}</td>
                        {vals.map((v, k) => (
                          <td key={k} className={`px-4 py-2.5 font-semibold ${differ ? "text-brand" : ""}`}>{v || "—"}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
