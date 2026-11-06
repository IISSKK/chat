import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getT } from "@/i18n/server";
import { getItem, listItems } from "@/lib/items";
import { formatNumber, itemPath, itemUrl, parseIdFromParam, photoUrl, typePath } from "@/lib/utils";
import { docsMessage, priceMessage, waLink } from "@/lib/whatsapp";
import { Gallery } from "@/components/catalog/Gallery";
import { ItemGrid, SoldBadge, specChips } from "@/components/catalog/ItemCard";
import { ShareMenu } from "@/components/catalog/ShareMenu";
import { ItemViews } from "@/components/catalog/ItemViews";
import { ArrowLeft, DocIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function load(params: Props["params"]) {
  const { slug } = await params;
  const id = parseIdFromParam(slug);
  const item = id ? getItem(id) : null;
  return { item, slug };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item } = await load(params);
  const t = await getT();
  if (!item) return { title: t.item.notFound };
  const desc = [
    item.status === "sold" ? "SOLDOUT" : t.status.available,
    ...specChips(item, t),
    item.vin && `VIN ${item.vin}`,
    item.notes,
  ].filter(Boolean).join(" · ").slice(0, 200);
  const images = item.photos.length
    ? item.photos.slice(0, 1).map((p) => ({ url: `${siteConfig.url}${photoUrl(p.filename)}`, alt: item.title }))
    : [{ url: `${siteConfig.url}/og-default.jpg`, width: 1200, height: 630 }];
  return {
    title: item.title,
    description: desc,
    alternates: { canonical: itemPath(item) },
    openGraph: { type: "article", title: `${item.title} — ${siteConfig.name}`, description: desc, url: itemUrl(item), images, locale: t.meta.ogLocale },
    twitter: { card: "summary_large_image", title: item.title, description: desc, images: images.map((i) => i.url) },
  };
}

export default async function ItemPage({ params }: Props) {
  const { item, slug } = await load(params);
  if (!item) notFound();
  if (slug !== `${item.id}-${item.slug}`) permanentRedirect(itemPath(item));
  const t = await getT();

  const sold = item.status === "sold";
  const fuel = t.fuel[item.fuel as keyof typeof t.fuel] ?? item.fuel;
  const trans = t.transmission[item.transmission as keyof typeof t.transmission] ?? item.transmission;
  const specs: [string, string | null][] = [
    [t.fields.brand, item.brand],
    [t.fields.model, item.model],
    [t.fields.year, item.year ? String(item.year) : null],
    [t.fields.firstRegistration, item.first_registration],
    [t.fields.vin, item.vin],
    [t.fields.serial, item.serial],
    [t.fields.engineCode, item.engine_code],
    [t.fields.displacement, item.displacement ? `${formatNumber(item.displacement, t.meta.intl)} ${t.units.cc}` : null],
    [t.fields.transmission, trans],
    [t.fields.mileage, item.mileage !== null ? `${formatNumber(item.mileage, t.meta.intl)} ${t.units.km}` : null],
    [t.fields.fuel, fuel],
  ];
  const similar = listItems({ type: item.type, status: "available", brand: item.brand || undefined }, 1, 5).items
    .filter((i) => i.id !== item.id)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": item.type === "car" ? "Car" : "Product",
    name: item.title,
    brand: item.brand || undefined,
    model: item.model || undefined,
    vehicleIdentificationNumber: item.vin || undefined,
    productionDate: item.year ? String(item.year) : undefined,
    image: item.photos.map((p) => `${siteConfig.url}${photoUrl(p.filename)}`),
    url: itemUrl(item),
  };

  return (
    <div className="container pt-6 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-5 flex items-center gap-2 text-sm text-fg/50">
        <Link href={typePath(item.type)} className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 py-1.5 font-semibold text-fg/80 transition hover:bg-fg/10">
          <ArrowLeft className="h-4 w-4" /> {t.types[item.type]}
        </Link>
        {item.type === "car" && (
          <Link href={`/catalog/cars/${item.category}`} className="hidden hover:text-fg sm:inline">/ {t.categoriesLong[item.category]}</Link>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div className="relative">
          <Gallery photos={item.photos.map((p) => photoUrl(p.filename))} title={item.title} sold={sold} />
          {sold && <SoldBadge label={t.status.sold} className="pointer-events-none absolute left-4 top-4 z-10 text-lg" />}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-ember/10 text-ember">{t.typeSingle[item.type]}</span>
            {item.type === "car" && <span className="chip">{t.categories[item.category]}</span>}
            <span className={`chip ${sold ? "bg-[#FF3B30]/10 text-[#FF3B30]" : "bg-[#34C759]/12 text-[#1F9D45]"}`}>{sold ? t.status.soldShort : t.status.available}</span>
            <ItemViews id={item.id} initial={item.views} />
          </div>
          <h1 className="h-display mt-4 text-2xl leading-tight sm:text-4xl">{item.title}</h1>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {specChips(item, t).map((c) => <span key={c} className="chip text-sm">{c}</span>)}
          </div>

          <div className="mt-6 rounded-3xl surface p-4 sm:p-5">
            <p className="mb-4 text-sm text-fg/60">{sold ? t.item.soldNote : t.item.contactNote}</p>
            <div className="grid gap-2">
              <a href={waLink(priceMessage(item, t))} target="_blank" rel="noopener" className="btn-wa w-full py-4 text-base">
                <WhatsAppIcon /> {t.actions.askPrice}
              </a>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <a href={waLink(docsMessage(item, t))} target="_blank" rel="noopener" className="btn-ghost py-3">
                  <DocIcon className="h-4 w-4" /> {t.actions.docs}
                </a>
                <ShareMenu url={itemUrl(item)} title={item.title} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-fg/40">{t.item.specs}</h2>
            <dl className="divide-y divide-fg/[0.06] overflow-hidden rounded-3xl surface">
              {specs.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(110px,40%)_1fr] gap-3 px-4 py-3 text-sm sm:px-5">
                  <dt className="text-fg/50">{k}</dt>
                  <dd className={`font-semibold ${k === t.fields.vin || k === t.fields.serial ? "break-all font-mono" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {item.notes && (
            <div className="mt-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-fg/40">{t.fields.notes}</h2>
              <p className="whitespace-pre-line rounded-3xl surface p-5 text-sm leading-relaxed text-fg/80">{item.notes}</p>
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="h-display mb-6 text-2xl sm:text-3xl">{t.item.similar}</h2>
          <ItemGrid items={similar} />
        </section>
      )}
    </div>
  );
}
