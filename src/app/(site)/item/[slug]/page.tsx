import type { Metadata } from "next";
import Link from "@/components/site/LocLink";
import { notFound, permanentRedirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { localePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { getItem, getItemAny, listItems } from "@/lib/items";
import { getCurrentAdmin } from "@/lib/admins";
import { brandModelSlugs } from "@/lib/catalog-refs";
import { formatNumber, itemPath, itemUrl, parseIdFromParam, photoUrl, photoSet, typePath } from "@/lib/utils";
import { waOptions } from "@/lib/contacts";
import { parseVideoUrl } from "@/lib/video";
import { alternatesFor, absoluteUrl, safeJsonLd, OG_ALTERNATE_LOCALES } from "@/lib/seo";
import { Gallery } from "@/components/catalog/Gallery";
import { ItemGrid, SoldBadge, specChips } from "@/components/catalog/ItemCard";
import { ShareMenu } from "@/components/catalog/ShareMenu";
import { ItemViews } from "@/components/catalog/ItemViews";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { VideoPlayer } from "@/components/catalog/VideoPlayer";
import { generationFor } from "@/lib/catalog-refs";
import { LeadButton } from "@/components/site/LeadModal";
import { WaButton } from "@/components/site/WaButton";
import { ArrowLeft, DocIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

/** Объявление для страницы. Черновик и корзину видит только вошедший администратор (предпросмотр). */
async function load(params: Props["params"]) {
  const { slug } = await params;
  const id = parseIdFromParam(slug);
  const locale = await getLocale();
  let item = id ? getItem(id, locale) : null;
  let preview: "draft" | "trash" | null = null;
  if (!item && id && (await getCurrentAdmin())) {
    item = getItemAny(id, locale);
    preview = item ? (item.deleted_at ? "trash" : item.status === "draft" ? "draft" : null) : null;
  }
  return { item, slug, preview };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item, preview } = await load(params);
  const t = await getT();
  const locale = await getLocale();
  if (!item) return { title: t.item.notFound, robots: { index: false } };
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
    robots: preview ? { index: false, follow: false } : undefined,
    alternates: await alternatesFor(itemPath(item)),
    openGraph: { type: "article", title: `${item.title} — ${siteConfig.name}`, description: desc, url: itemUrl(item, locale), images, locale: t.meta.ogLocale, alternateLocale: OG_ALTERNATE_LOCALES(locale) },
    twitter: { card: "summary_large_image", title: item.title, description: desc, images: images.map((i) => i.url) },
  };
}

export default async function ItemPage({ params }: Props) {
  const { item, slug, preview } = await load(params);
  if (!item) notFound();
  const locale = await getLocale();
  if (slug !== `${item.id}-${item.slug}`) permanentRedirect(localePath(locale, itemPath(item)));
  const t = await getT();

  const sold = item.status === "sold";
  const fuel = t.fuel[item.fuel as keyof typeof t.fuel] ?? item.fuel;
  const trans = t.transmission[item.transmission as keyof typeof t.transmission] ?? item.transmission;
  const slugs = item.type === "car" ? brandModelSlugs(item.brand, item.model) : brandModelSlugs(item.brand, "");
  const gen = item.type === "car" ? generationFor(item.brand, item.model, item.year) : null;
  const video = item.video_url ? parseVideoUrl(item.video_url) : null;

  const specs: [string, string | null, string?][] = [
    [t.fields.brand, item.brand, slugs.brand ? `/brand/${slugs.brand.slug}` : undefined],
    [t.fields.model, item.model, slugs.brand && slugs.model ? `/brand/${slugs.brand.slug}/${slugs.model.slug}` : undefined],
    [t.fields.body, item.type === "car" && item.body ? t.body[item.body as keyof typeof t.body] ?? item.body : null],
    [t.fields.year, item.year ? String(item.year) : null],
    [t.fields.generation, gen ? `${gen.name} (${gen.year_from}–${gen.year_to})` : null],
    [t.fields.firstRegistration, item.first_registration],
    [t.fields.vin, item.vin],
    [t.fields.serial, item.serial],
    [t.fields.engineCode, item.engine_code],
    [t.fields.displacement, item.displacement ? `${formatNumber(item.displacement, t.meta.intl)} ${t.units.cc}` : null],
    [t.fields.transmission, trans],
    [t.fields.mileage, item.mileage !== null ? `${formatNumber(item.mileage, t.meta.intl)} ${t.units.km}` : null],
    [t.fields.fuel, fuel],
  ];
  const similar = listItems({ type: item.type, status: "available", brand: item.brand || undefined }, 1, 5, locale).items
    .filter((i) => i.id !== item.id)
    .slice(0, 4);

  const crumbs = [
    { name: t.nav.home, url: absoluteUrl(locale, "/") },
    { name: t.types[item.type], url: absoluteUrl(locale, typePath(item.type)) },
    ...(slugs.brand && item.type === "car" ? [{ name: slugs.brand.name, url: absoluteUrl(locale, `/brand/${slugs.brand.slug}`) }] : []),
    ...(slugs.brand && slugs.model && item.type === "car" ? [{ name: slugs.model.name, url: absoluteUrl(locale, `/brand/${slugs.brand.slug}/${slugs.model.slug}`) }] : []),
    { name: item.title, url: itemUrl(item, locale) },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": item.type === "car" ? ["Product", "Car"] : "Product",
      name: item.title,
      description: item.notes || undefined,
      brand: item.brand ? { "@type": "Brand", name: item.brand } : undefined,
      model: item.model || undefined,
      vehicleIdentificationNumber: item.vin || undefined,
      productionDate: item.year ? String(item.year) : undefined,
      vehicleModelDate: item.year ? String(item.year) : undefined,
      mileageFromOdometer: item.mileage !== null && item.type === "car" ? { "@type": "QuantitativeValue", value: item.mileage, unitCode: "KMT" } : undefined,
      fuelType: item.fuel || undefined,
      vehicleTransmission: item.transmission || undefined,
      image: item.photos.map((p) => `${siteConfig.url}${photoUrl(p.filename)}`),
      url: itemUrl(item, locale),
      inLanguage: locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
    },
  ];

  return (
    <div className="container pt-6 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      {preview && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-flame/30 bg-flame/10 px-4 py-3 text-sm font-semibold text-[#9A4B00]">
          <span>👁 {preview === "trash" ? "В корзине — виден только вам" : t.misc.draftBanner}</span>
          <a href={`/admin/${item.type === "car" ? "cars" : "engines"}/${item.id}`} className="ml-auto underline">{t.misc.draftEdit} →</a>
        </div>
      )}
      <nav className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg/72" aria-label="breadcrumb">
        <Link href={typePath(item.type)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-fg/[0.09] px-3.5 py-2 font-semibold text-fg/80 transition hover:bg-fg/10">
          <ArrowLeft className="h-4 w-4" /> {t.types[item.type]}
        </Link>
        {slugs.brand && item.type === "car" && (
          <>
            <span>/</span>
            <Link href={`/brand/${slugs.brand.slug}`} className="inline-flex min-h-[40px] items-center px-1 hover:text-fg">{slugs.brand.name}</Link>
          </>
        )}
        {slugs.brand && slugs.model && item.type === "car" && (
          <>
            <span className="hidden sm:inline">/</span>
            <Link href={`/brand/${slugs.brand.slug}/${slugs.model.slug}`} className="hidden hover:text-fg sm:inline">{slugs.model.name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:items-start lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div className="space-y-5">
          <div className="relative">
            <Gallery photos={item.photos.map((p) => photoSet(p.filename))} title={item.title} sold={sold} />
            {sold && <SoldBadge label={t.status.sold} className="pointer-events-none absolute left-4 top-4 z-10 text-lg" />}
          </div>
          {video && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-fg/68">{t.video.title}</h2>
              <VideoPlayer embed={video.embed} title={item.title} poster={item.photos[0] ? photoUrl(item.photos[0].filename, "sm") : undefined} />
            </section>
          )}
        </div>

        <div className="md:sticky md:top-28 md:self-start">
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
            <p className="mb-4 text-sm text-fg/80">{sold ? t.item.soldNote : t.item.contactNote}</p>
            <div className="grid gap-2">
              <WaButton chooseLabel={t.whatsapp.choose} options={waOptions("price", item.id, t.meta.code)} className="btn-wa w-full py-4 text-base">
                <WhatsAppIcon /> {t.actions.askPrice}
              </WaButton>
              <div className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-1 min-[900px]:grid-cols-[1fr_auto]">
                <WaButton chooseLabel={t.whatsapp.choose} options={waOptions("docs", item.id, t.meta.code)} className="btn-ghost w-full py-3" wrapperClassName="min-w-0">
                  <DocIcon className="h-4 w-4" /> {t.actions.docs}
                </WaButton>
                <ShareMenu url={itemUrl(item, locale)} title={item.title} />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-1 min-[900px]:grid-cols-[1fr_auto]">
                <LeadButton itemId={item.id} itemTitle={item.title} className="btn-brand w-full py-3" />
                <FavoriteButton id={item.id} withLabel className="!h-auto !w-auto !rounded-full px-4" />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-fg/68">{t.item.specs}</h2>
            <dl className="divide-y divide-fg/[0.06] overflow-hidden rounded-3xl surface">
              {specs.filter(([, v]) => v).map(([k, v, href]) => (
                <div key={k} className="grid grid-cols-[minmax(110px,40%)_1fr] gap-3 px-4 py-3 text-sm sm:px-5">
                  <dt className="text-fg/72">{k}</dt>
                  <dd className={`font-semibold ${k === t.fields.vin || k === t.fields.serial ? "break-all font-mono" : ""}`}>
                    {href ? <Link href={href} className="-my-2 inline-block py-2 text-brand-600 hover:underline">{v}</Link> : v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {item.notes && (
            <div className="mt-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-fg/68">{t.fields.notes}</h2>
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
