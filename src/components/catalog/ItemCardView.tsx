import Link from "@/components/site/LocLink";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { Item } from "@/lib/types";
import { formatNumber, itemPath, itemUrl, photoUrl } from "@/lib/utils";
import { WaButton, type WaOption } from "@/components/site/WaButton";
import { FavoriteButton } from "./FavoriteButton";
import { CarIcon, DocIcon, EngineIcon, EyeIcon, PlayIcon, WhatsAppIcon } from "@/components/icons";
import { ShareMenu } from "./ShareMenu";

const catColor: Record<Item["category"], string> = {
  standby: "bg-brand/90 text-white",
  listing: "bg-white/85 text-fg",
  running: "bg-flame/90 text-white",
};

export function SoldBadge({ className = "", label = "SOLDOUT" }: { className?: string; label?: string }) {
  return (
    <span className={`inline-flex -rotate-6 items-center rounded-xl border-2 border-[#FF3B30] bg-white/90 px-3 py-1 text-sm font-extrabold tracking-widest text-[#FF3B30] shadow-lg ${className}`}>
      {label}
    </span>
  );
}

export function specChips(item: Item, t: Dictionary) {
  const chips: string[] = [];
  if (item.year) chips.push(String(item.year));
  if (item.mileage !== null) chips.push(`${formatNumber(item.mileage, t.meta.intl)} ${t.units.km}`);
  if (item.fuel) chips.push(t.fuel[item.fuel as keyof typeof t.fuel] ?? item.fuel);
  if (item.transmission) chips.push(t.transmission[item.transmission as keyof typeof t.transmission] ?? item.transmission);
  if (item.displacement) chips.push(`${(item.displacement / 1000).toFixed(1)} L`);
  return chips;
}

export function ViewsBadge({ views, t, className = "" }: { views: number; t: Dictionary; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[11px] font-bold text-fg/75 shadow-sm ${className}`} title={`${formatNumber(views, t.meta.intl)} ${plural(views, t.views, t.meta.intl)}`}>
      <EyeIcon className="h-3.5 w-3.5" /> {formatNumber(views, t.meta.intl)}
    </span>
  );
}

export function ItemCardView({ item, t, price, docs, index = 0, origin }: { item: Item; t: Dictionary; price: WaOption[]; docs: WaOption[]; index?: number; origin?: string }) {
  const href = itemPath(item);
  const cover = item.photos[0];
  const sold = item.status === "sold";
  const TypeIcon = item.type === "car" ? CarIcon : EngineIcon;

  return (
    <article
      data-reveal
      style={{ "--d": `${(index % 4) * 60}ms` } as React.CSSProperties}
      className="surface group relative flex flex-col rounded-[26px] transition-[transform,box-shadow] duration-300 focus-within:z-20 hover:z-10 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(15,40,90,.35)]"
    >
      <Link href={href} className="card-press relative m-1.5 block aspect-[4/3] overflow-hidden rounded-[20px] bg-ink-600" aria-label={item.title}>
        {cover ? (
          <img
            src={photoUrl(cover.filename, "sm")}
            alt={item.title}
            loading="lazy"
            decoding="async"
            width={600}
            height={450}
            className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${sold ? "grayscale" : ""}`}
          />
        ) : (
          <div className="grid h-full place-items-center text-fg/30">
            <TypeIcon className="h-10 w-10" />
            <span className="text-xs">{t.common.noPhoto}</span>
          </div>
        )}
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          {item.type === "car" && (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${catColor[item.category]}`}>{t.categories[item.category]}</span>
          )}
        </div>
        <ViewsBadge views={item.views} t={t} className="absolute bottom-2.5 right-2.5" />
        {item.video_url && (
          <span className="absolute bottom-2.5 left-14 grid h-6 w-6 place-items-center rounded-full bg-flame text-white shadow-sm" title={t.video.badge} aria-label={t.video.badge}>
            <PlayIcon className="h-3 w-3" />
          </span>
        )}
        {item.photos.length > 1 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-fg/45 px-2 py-1 text-[11px] font-bold text-white">1/{item.photos.length}</span>
        )}
        {sold && <SoldBadge label={t.status.sold} className="absolute right-2.5 top-2.5" />}
      </Link>
      <FavoriteButton id={item.id} className={`absolute right-3.5 ${sold ? "top-12" : "top-3.5"}`} />

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-2">
        <div>
          <Link href={href} className="line-clamp-2 text-[16px] font-bold leading-snug tracking-tight transition-colors hover:text-brand">
            {item.title}
          </Link>
          {(item.vin || item.serial) && (
            <p className="mt-1 truncate font-mono text-[11px] text-fg/40">{item.vin ? `VIN ${item.vin}` : `S/N ${item.serial}`}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {specChips(item, t).map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>

        <div className="mt-auto grid gap-2 pt-1">
          <WaButton options={price} className="btn-wa w-full py-2.5">
            <WhatsAppIcon className="h-4 w-4" /> {t.actions.askPrice}
          </WaButton>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <WaButton options={docs} className="btn-ghost w-full min-w-0 px-3 py-2.5 text-xs" wrapperClassName="min-w-0" ariaLabel={t.actions.docs}>
              <DocIcon className="h-4 w-4 shrink-0 text-brand" /> <span className="truncate">{t.actions.docs}</span>
            </WaButton>
            <ShareMenu url={origin ? `${origin}${localePath(t.meta.code as Locale, itemPath(item))}` : itemUrl(item, t.meta.code as Locale)} title={item.title} compact />
          </div>
        </div>
      </div>
    </article>
  );
}

