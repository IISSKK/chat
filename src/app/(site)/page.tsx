import Link from "next/link";
import { t } from "@/i18n";
import { countBy, listItems } from "@/lib/items";
import type { Category, Item } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { ItemCard } from "@/components/catalog/ItemCard";
import { SearchBox } from "@/components/site/SearchBox";
import { HeroBanner } from "@/components/site/HeroBanner";
import { bannerSlides } from "@/config/banners";
import { Advantages, ContactCards, Guides, SectionTitle } from "@/components/site/Sections";
import { ArrowRight, CarIcon, EngineIcon, GearIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const QUICK = ["Sonata", "Santa Fe", "D4HB", "2021", "KMH", "G4KE"];
const BRANDS = ["HYUNDAI", "KIA", "GENESIS", "SSANGYONG", "RENAULT SAMSUNG", "CHEVROLET KOREA"];

/** Горизонтальная лента на телефоне, сетка на десктопе. */
function Rail({ items }: { items: Item[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it, i) => (
        <div key={it.id} className="w-[78%] shrink-0 snap-start min-[480px]:w-[46%] sm:w-auto">
          <ItemCard item={it} index={i} />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const counts = { car: countBy({ type: "car" }), engine: countBy({ type: "engine" }), part: countBy({ type: "part" }) };
  const sections: { cat: Category; eyebrow: string }[] = [
    { cat: "standby", eyebrow: "Готовы к отгрузке" },
    { cat: "listing", eyebrow: "Свежие поступления" },
    { cat: "running", eyebrow: "Проверено на ходу" },
  ];

  const categories = [
    { href: "/catalog/cars", title: t.types.car, text: t.home.categoryCars, count: counts.car, Icon: CarIcon, grad: "from-ember via-ember/60 to-flame/40", accent: "text-brand" },
    { href: "/catalog/engines", title: t.types.engine, text: t.home.categoryEngines, count: counts.engine, Icon: EngineIcon, grad: "from-flame via-flame/60 to-sun/40", accent: "text-ink" },
    { href: "/catalog/parts", title: t.types.part, text: t.home.categoryParts, count: counts.part, Icon: GearIcon, grad: "from-brand-600 via-flame/60 to-ember/50", accent: "text-ink" },
  ];

  return (
    <>
      {/* БАННЕР */}
      <HeroBanner slides={bannerSlides} whatsappBase={waLink("").split("?")[0]} />

      {/* Панель поиска поверх нижнего края баннера */}
      <section className="container relative z-20 -mt-14 sm:-mt-20">
        <div className="animate-fade-up rounded-4xl bg-gradient-to-r from-brand/50 via-flame/30 to-ember/40 p-px shadow-[0_40px_120px_-40px_rgb(var(--c-flame)/0.55)] [animation-delay:300ms]">
          <div className="grid gap-6 rounded-4xl bg-ink-800/90 p-5 backdrop-blur-2xl sm:p-8 lg:grid-cols-[1.7fr_1fr] lg:items-center lg:gap-10">
            <div>
              <p className="mb-3 font-display text-lg font-bold sm:text-2xl">{t.search.hint}</p>
              <SearchBox size="lg" />
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-brand/40 hover:text-brand">
                    {q}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                [counts.car, t.nav.cars],
                [counts.engine, t.nav.engines],
                [counts.part, t.nav.parts],
              ].map(([n, l]) => (
                <div key={l} className="rounded-3xl border border-white/[0.07] bg-white/[0.03] px-2 py-4 text-center">
                  <div className="font-display text-3xl font-bold text-brand sm:text-4xl">{n}</div>
                  <div className="mt-1 text-xs text-white/55">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Бегущая строка брендов */}
      <div className="relative mt-16 overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-5 sm:mt-24" aria-hidden>
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-2xl font-bold text-white/15 sm:text-4xl">
          {[...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="flex items-center gap-12">{b}<span className="text-brand/40">✦</span></span>
          ))}
        </div>
      </div>

      {/* Категории */}
      <section className="container mt-16 sm:mt-24">
        <SectionTitle title={t.home.categoriesTitle} />
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              data-reveal
              style={{ "--d": `${i * 100}ms` } as React.CSSProperties}
              className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-4xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_-30px_rgb(var(--c-flame)/0.5)] sm:min-h-[360px] sm:p-9 lg:min-h-[420px]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.grad} transition-transform duration-700 group-hover:scale-110`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgb(var(--c-cream)/0.3),transparent_45%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <c.Icon className="absolute -bottom-6 -right-6 h-44 w-44 text-white/15 transition-transform duration-700 group-hover:rotate-[-10deg] group-hover:scale-110 sm:h-56 sm:w-56" strokeWidth={1.2} />
              <div className="relative flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink/30 text-white backdrop-blur">
                  <c.Icon className="h-7 w-7" />
                </span>
                <span className="rounded-full bg-ink/30 px-3 py-1 text-xs font-bold backdrop-blur">{c.count} {t.home.items}</span>
              </div>
              <div className="relative">
                <h3 className="h-display text-3xl sm:text-4xl">{c.title}</h3>
                <p className="mt-2 max-w-xs text-sm text-white/85">{c.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink transition-all duration-300 group-hover:gap-3 group-hover:bg-brand">
                  {t.common.viewAll} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Подборки автомобилей */}
      {sections.map(({ cat, eyebrow }) => {
        const items = listItems({ type: "car", category: cat }, 1, 8).items;
        if (!items.length) return null;
        return (
          <section key={cat} className="container mt-20 sm:mt-28">
            <SectionTitle eyebrow={eyebrow} title={t.categoriesLong[cat]} href={`/catalog/cars/${cat}`} />
            <Rail items={items} />
          </section>
        );
      })}

      {/* Преимущества */}
      <section className="container mt-20 sm:mt-28">
        <SectionTitle eyebrow="KORIDA Export" title={t.home.advantagesTitle} />
        <Advantages />
      </section>

      {/* Руководство покупателя */}
      <section className="container mt-20 sm:mt-28">
        <div data-reveal className="relative overflow-hidden rounded-4xl border border-white/[0.08] bg-gradient-to-br from-ember/25 via-ink-800 to-flame/15 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">PDF</p>
              <h2 className="h-display text-2xl sm:text-4xl">{t.home.guidesTitle}</h2>
              <p className="mt-3 text-white/65">{t.home.guidesText}</p>
            </div>
            <Guides />
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section id="contacts" className="container mt-20 scroll-mt-28 sm:mt-28">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div data-reveal>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">24/7 online</p>
            <h2 className="h-display text-3xl sm:text-5xl">{t.home.contactsTitle}</h2>
            <p className="mt-4 max-w-md text-white/65">{t.home.contactsText}</p>
            <a href={waLink(t.whatsapp.generic)} target="_blank" rel="noopener" className="btn-wa mt-6 px-7 py-4 text-base">
              <WhatsAppIcon /> {t.home.writeWhatsapp}
            </a>
          </div>
          <ContactCards />
        </div>
      </section>
    </>
  );
}
