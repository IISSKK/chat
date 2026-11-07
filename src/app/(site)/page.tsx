import { KoreaFlag } from "@/components/site/KoreaFlag";
import Link from "@/components/site/LocLink";
import { getLocale, getT } from "@/i18n/server";
import type { Metadata } from "next";
import { alternatesFor, safeJsonLd } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { publicBrandIndex } from "@/lib/catalog-refs";
import { LeadButton } from "@/components/site/LeadModal";
import { localePath } from "@/i18n/config";
import { countBy, listItems } from "@/lib/items";
import type { Category, Item } from "@/lib/types";
import { itemPath, photoUrl } from "@/lib/utils";
import { waOptions } from "@/lib/contacts";
import { WaButton } from "@/components/site/WaButton";
import { ItemCard, ViewsBadge, specChips } from "@/components/catalog/ItemCard";
import { SearchBox } from "@/components/site/SearchBox";
import { Advantages, ContactCards, Guides, SectionTitle } from "@/components/site/Sections";
import { ArrowRight, CarIcon, EngineIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: await alternatesFor("/") };
}

const QUICK = ["Sonata", "Santa Fe", "Palisade", "D4HB", "2022", "KMH"];

/** Горизонтальная лента на телефоне, сетка на компьютере. */
function Rail({ items }: { items: Item[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it, i) => (
        <div key={it.id} className="w-[80%] shrink-0 snap-start min-[480px]:w-[46%] sm:w-auto">
          <ItemCard item={it} index={i} />
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const t = await getT();
  const locale = await getLocale();
  const counts = { car: countBy({ type: "car" }), engine: countBy({ type: "engine" }) };
  const featured = listItems({ type: "car", status: "available" }, 1, 1, locale).items[0];
  const engineCover = listItems({ type: "engine", status: "available" }, 1, 1, locale).items[0];

  const sections: { cat: Category; eyebrow: string }[] = [
    { cat: "standby", eyebrow: t.home.eyebrowStandby },
    { cat: "listing", eyebrow: t.home.eyebrowListing },
    { cat: "running", eyebrow: t.home.eyebrowRunning },
  ];

  const categories = [
    { href: "/catalog/cars", title: t.types.car, text: t.home.categoryCars, count: counts.car, Icon: CarIcon, tint: "from-brand/85 via-brand/40", cover: featured },
    { href: "/catalog/engines", title: t.types.engine, text: t.home.categoryEngines, count: counts.engine, Icon: EngineIcon, tint: "from-flame/85 via-flame/40", cover: engineCover },
  ];

  const brandChips = publicBrandIndex().slice(0, 10);
  const orgLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.svg`,
      email: siteConfig.email,
      address: { "@type": "PostalAddress", addressLocality: "Incheon", addressCountry: "KR" },
      description: t.meta.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      inLanguage: locale,
      potentialAction: { "@type": "SearchAction", target: `${siteConfig.url}${localePath(locale, "/search")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgLd) }} />
      {/* ПЕРВЫЙ ЭКРАН */}
      <section className="container pb-6 pt-8 sm:pt-14 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <div className="text-center lg:text-left">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-flame" /> {t.home.heroBadge}
            </span>
            <h1 className="h-display relative isolate mt-5 text-[2.5rem] leading-[1.03] sm:text-6xl lg:text-[4.3rem]">
              <KoreaFlag className="pointer-events-none absolute -inset-x-3 -inset-y-4 -z-10 h-[calc(100%+2rem)] w-[calc(100%+1.5rem)] opacity-[0.17] [mask-image:radial-gradient(ellipse_at_center,#000_40%,transparent_92%)]" />
              <span className="block animate-fade-up [animation-delay:60ms]">{t.home.heroTitle1}</span>
              <span className="block animate-fade-up text-gradient [animation-delay:120ms]">{t.home.heroTitle2}</span>
              <span className="block animate-fade-up [animation-delay:180ms]">{t.home.heroTitle3}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl animate-fade-up text-[17px] leading-relaxed text-fg/60 [animation-delay:240ms] lg:mx-0">{t.home.heroText}</p>
            <div className="relative z-20 mx-auto mt-7 max-w-xl animate-fade-up [animation-delay:300ms] lg:mx-0">
              <SearchBox size="lg" />
              <div className="mt-3.5 flex flex-wrap justify-center gap-2 lg:justify-start">
                {QUICK.map((q) => (
                  <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="press rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-fg/60 ring-1 ring-fg/[0.06] hover:bg-white hover:text-brand">
                    {q}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Витрина: свежий автомобиль + плитки разделов */}
          <div className="animate-fade-up [animation-delay:200ms]">
            {featured && (
              <Link href={itemPath(featured)} className="card-press surface group relative block overflow-hidden rounded-[32px] p-2">
                <div className="relative aspect-[16/11] overflow-hidden rounded-[26px] bg-ink-600">
                  {featured.photos[0] && (
                    <img src={photoUrl(featured.photos[0].filename)} alt={featured.title} fetchPriority="high" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-brand/90 px-3 py-1 text-xs font-bold text-white shadow-sm">{t.categories[featured.category]}</span>
                  <ViewsBadge views={featured.views} t={t} className="absolute right-3 top-3" />
                  <div className="glass absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{featured.title}</p>
                      <p className="truncate text-xs text-fg/55">{specChips(featured, t).slice(0, 3).join(" · ")}</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {categories.map((c) => (
                <Link key={c.href} href={c.href} className="card-press surface flex items-center gap-3 rounded-3xl p-3.5 transition-shadow hover:shadow-lg">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${c.Icon === CarIcon ? "bg-brand/10 text-brand" : "bg-flame/10 text-flame"}`}>
                    <c.Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{c.title}</span>
                    <span className="block text-xs text-fg/50">{c.count} {t.home.items}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {brandChips.length > 0 && (
        <section className="container mt-10 sm:mt-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-fg/40">{t.brandPage.popular}</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
            {brandChips.map(({ brand, count }) => (
              <Link key={brand.id} href={`/brand/${brand.slug}`} className="press shrink-0 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold ring-1 ring-fg/10 hover:bg-white hover:text-brand">
                {brand.name} <span className="text-fg/40">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Категории */}
      <section className="container mt-16 sm:mt-24">
        <SectionTitle title={t.home.categoriesTitle} />
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              data-reveal
              style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
              className="card-press group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-[32px] p-6 text-white shadow-[0_20px_50px_-25px_rgba(15,40,90,.5)] sm:min-h-[340px] sm:p-8"
            >
              {c.cover?.photos[0] && (
                <img src={photoUrl(c.cover.photos[0].filename, "sm")} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              )}
              <div className={`absolute inset-0 bg-gradient-to-t ${c.tint} to-transparent`} />
              <span className="absolute right-5 top-5 rounded-full border border-white/40 bg-white/25 px-3 py-1 text-xs font-bold">{c.count} {t.home.items}</span>
              <div className="relative">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/40 bg-white/25">
                  <c.Icon className="h-6 w-6" />
                </span>
                <h3 className="h-display text-3xl sm:text-4xl">{c.title}</h3>
                <p className="mt-1.5 max-w-sm text-sm text-white/85">{c.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/85 px-4 py-2 text-sm font-semibold text-fg transition-all duration-300 group-hover:gap-3">
                  {t.common.viewAll} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Подборки */}
      {sections.map(({ cat, eyebrow }) => {
        const items = listItems({ type: "car", category: cat }, 1, 8, locale).items;
        if (!items.length) return null;
        return (
          <section key={cat} className="cv-auto container mt-20 sm:mt-24">
            <SectionTitle eyebrow={eyebrow} title={t.categoriesLong[cat]} href={`/catalog/cars/${cat}`} />
            <Rail items={items} />
          </section>
        );
      })}
      {(() => {
        const engines = listItems({ type: "engine" }, 1, 8, locale).items;
        return engines.length ? (
          <section className="cv-auto container mt-20 sm:mt-24">
            <SectionTitle eyebrow={t.home.eyebrowEngines} title={t.types.engine} href="/catalog/engines" />
            <Rail items={engines} />
          </section>
        ) : null;
      })()}

      {/* Преимущества */}
      <section className="cv-auto container mt-20 sm:mt-24">
        <SectionTitle eyebrow="Barakat Auto" title={t.home.advantagesTitle} />
        <Advantages />
      </section>

      {/* Руководство покупателя */}
      <section className="cv-auto container mt-20 sm:mt-24">
        <div data-reveal className="surface relative overflow-hidden rounded-[32px] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-flame/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-flame">PDF</p>
              <h2 className="h-display text-3xl sm:text-4xl">{t.home.guidesTitle}</h2>
              <p className="mt-3 text-fg/60">{t.home.guidesText}</p>
            </div>
            <Guides />
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section id="contacts" className="container mt-20 scroll-mt-28 sm:mt-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div data-reveal>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">{t.home.eyebrowContacts}</p>
            <h2 className="h-display text-4xl sm:text-5xl">{t.home.contactsTitle}</h2>
            <p className="mt-4 max-w-md text-fg/60">{t.home.contactsText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
            <LeadButton className="btn-brand px-7 py-4 text-base" />
            <WaButton options={waOptions("generic", undefined, t.meta.code)} placement="up" className="btn-wa px-7 py-4 text-base" wrapperClassName="inline-block">
              <WhatsAppIcon /> {t.home.writeWhatsapp}
            </WaButton>
            </div>
          </div>
          <ContactCards />
        </div>
      </section>
    </>
  );
}
