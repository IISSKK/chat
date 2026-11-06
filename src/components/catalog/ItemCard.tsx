import Link from "next/link";
import { t } from "@/i18n";
import type { Item } from "@/lib/types";
import { formatNumber, itemPath, itemUrl, photoUrl } from "@/lib/utils";
import { docsMessage, priceMessage, waLink } from "@/lib/whatsapp";
import { CarIcon, DocIcon, EngineIcon, GearIcon, WhatsAppIcon } from "@/components/icons";
import { ShareMenu } from "./ShareMenu";

const catColor: Record<Item["category"], string> = {
  standby: "bg-brand text-ink",
  listing: "bg-ember text-white",
  running: "bg-glow text-ink",
};

export function SoldBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex -rotate-6 items-center rounded-lg border-2 border-flame bg-ink/80 px-3 py-1 font-display text-sm font-extrabold tracking-widest text-flame backdrop-blur ${className}`}>
      {t.status.sold}
    </span>
  );
}

export function specChips(item: Item) {
  const chips: string[] = [];
  if (item.year) chips.push(String(item.year));
  if (item.mileage !== null) chips.push(`${formatNumber(item.mileage)} ${t.units.km}`);
  if (item.fuel) chips.push(t.fuel[item.fuel as keyof typeof t.fuel] ?? item.fuel);
  if (item.transmission) chips.push(t.transmission[item.transmission as keyof typeof t.transmission] ?? item.transmission);
  if (item.displacement) chips.push(`${(item.displacement / 1000).toFixed(1)} L`);
  return chips;
}

export function ItemCard({ item, index = 0 }: { item: Item; index?: number }) {
  const href = itemPath(item);
  const cover = item.photos[0];
  const sold = item.status === "sold";
  const TypeIcon = item.type === "car" ? CarIcon : item.type === "engine" ? EngineIcon : GearIcon;

  return (
    <article
      data-reveal
      style={{ "--d": `${(index % 4) * 70}ms` } as React.CSSProperties}
      className="group relative flex flex-col rounded-3xl border border-white/[0.07] bg-ink-800/80 transition-all focus-within:z-20 hover:z-10 duration-300 hover:-translate-y-1.5 hover:border-white/15 hover:shadow-[0_20px_60px_-20px_rgb(var(--c-brand)/0.35)]"
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden rounded-t-3xl bg-ink-700" aria-label={item.title}>
        {cover ? (
          <img
            src={photoUrl(cover.filename)}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07] ${sold ? "grayscale-[60%]" : ""}`}
          />
        ) : (
          <div className="grid h-full place-items-center text-white/30">
            <TypeIcon className="h-10 w-10" />
            <span className="text-xs">{t.common.noPhoto}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-transparent to-transparent opacity-80" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.type === "car" && (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${catColor[item.category]}`}>
              {t.categories[item.category]}
            </span>
          )}
          {item.photos.length > 1 && (
            <span className="rounded-full bg-ink/70 px-2 py-1 text-[11px] font-bold text-white/80 backdrop-blur">📷 {item.photos.length}</span>
          )}
        </div>
        {sold && <SoldBadge className="absolute right-3 top-3" />}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <Link href={href} className="line-clamp-2 font-display text-[15px] font-bold leading-snug transition-colors hover:text-brand sm:text-base">
            {item.title}
          </Link>
          {(item.vin || item.serial) && (
            <p className="mt-1 truncate font-mono text-[11px] text-white/40">
              {item.vin ? `VIN ${item.vin}` : `S/N ${item.serial}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {specChips(item).map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>

        <div className="mt-auto grid gap-2 pt-1">
          <a href={waLink(priceMessage(item))} target="_blank" rel="noopener" className="btn-wa w-full py-2.5">
            <WhatsAppIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-12deg]" /> {t.actions.askPrice}
          </a>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <a href={waLink(docsMessage(item))} target="_blank" rel="noopener" className="btn-ghost min-w-0 px-3 py-2.5 text-xs" title={t.actions.docs}>
              <DocIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{t.actions.docs}</span>
            </a>
            <ShareMenu url={itemUrl(item)} title={item.title} compact />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ItemGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it, i) => (
        <ItemCard key={it.id} item={it} index={i} />
      ))}
    </div>
  );
}
