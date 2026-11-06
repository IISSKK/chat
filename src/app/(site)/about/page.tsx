import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { t } from "@/i18n";
import { waLink } from "@/lib/whatsapp";
import { countBy } from "@/lib/items";
import { Advantages, ContactCards, Guides, SectionTitle } from "@/components/site/Sections";
import { WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.about.title, description: t.about.lead };

export default function AboutPage() {
  const stats = [
    [String(countBy({}) ), "позиций в каталоге"],
    ["40+", "стран отгрузки"],
    ["10 лет", "на рынке экспорта"],
    ["15 мин", "среднее время ответа"],
  ];
  return (
    <div className="container pt-10 sm:pt-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-lime">{siteConfig.name}</p>
          <h1 className="h-display text-4xl leading-tight sm:text-6xl">
            Экспорт из Кореи <span className="text-gradient">без лишних шагов</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/65">{t.about.lead}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(([n, l], i) => (
            <div key={l} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties} className="rounded-3xl border border-white/[0.07] bg-ink-800/60 p-5">
              <div className="font-display text-3xl font-bold text-lime">{n}</div>
              <div className="mt-1 text-sm text-white/55">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionTitle title={t.home.advantagesTitle} />
        <Advantages />
      </section>

      <section className="mt-20">
        <div data-reveal className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-lime via-aqua to-violet p-[1.5px]">
          <div className="rounded-4xl bg-ink-800 p-6 sm:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_auto] lg:items-center">
              <div>
                <h2 className="h-display text-2xl sm:text-4xl">{t.about.partnershipTitle}</h2>
                <p className="mt-3 max-w-2xl text-white/65">{t.about.partnershipText}</p>
              </div>
              <a href={waLink("Здравствуйте! Интересует партнёрство с " + siteConfig.name + ".")} target="_blank" rel="noopener" className="btn-lime px-7 py-4 text-base">
                <WhatsAppIcon /> {t.about.partnershipCta}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <SectionTitle title={t.home.guidesTitle} />
        <p data-reveal className="-mt-3 mb-6 max-w-2xl text-white/60">{t.home.guidesText}</p>
        <Guides wide />
      </section>

      <section className="mt-20">
        <SectionTitle title={t.home.contactsTitle} />
        <ContactCards />
      </section>
    </div>
  );
}
