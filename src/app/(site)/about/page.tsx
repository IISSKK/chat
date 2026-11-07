import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getT } from "@/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { fmt } from "@/i18n/format";
import { waOptions } from "@/lib/contacts";
import { WaButton } from "@/components/site/WaButton";
import { countBy } from "@/lib/items";
import { Advantages, ContactCards, Guides, SectionTitle } from "@/components/site/Sections";
import { WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.about.title, description: t.about.lead, alternates: await alternatesFor("/about") };
}

export default async function AboutPage() {
  const t = await getT();
  const stats = [
    [String(countBy({})), t.about.statItems],
    ["40+", t.about.statCountries],
    [t.about.statYearsValue, t.about.statYears],
    [t.about.statResponseValue, t.about.statResponse],
  ];
  return (
    <div className="container pt-10 sm:pt-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">{siteConfig.name}</p>
          <h1 className="h-display text-4xl leading-tight sm:text-6xl">
            {t.about.heroA} <span className="text-gradient">{t.about.heroB}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-fg/65">{t.about.lead}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(([n, l], i) => (
            <div key={l} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties} className="rounded-3xl surface p-5">
              <div className="font-display text-3xl font-bold text-brand">{n}</div>
              <div className="mt-1 text-sm text-fg/55">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionTitle title={t.home.advantagesTitle} />
        <Advantages />
      </section>

      <section className="mt-20">
        <div data-reveal className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand via-glow to-ember p-[1.5px]">
          <div className="rounded-4xl bg-ink-800 p-6 sm:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_auto] lg:items-center">
              <div>
                <h2 className="h-display text-2xl sm:text-4xl">{t.about.partnershipTitle}</h2>
                <p className="mt-3 max-w-2xl text-fg/65">{t.about.partnershipText}</p>
              </div>
              <WaButton options={waOptions("partner", undefined, t.meta.code)} placement="up" align="right" className="btn-brand px-7 py-4 text-base">
                <WhatsAppIcon /> {t.about.partnershipCta}
              </WaButton>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <SectionTitle title={t.home.guidesTitle} />
        <p data-reveal className="-mt-3 mb-6 max-w-2xl text-fg/60">{t.home.guidesText}</p>
        <Guides wide />
      </section>

      <section className="mt-20">
        <SectionTitle title={t.home.contactsTitle} />
        <ContactCards />
      </section>
    </div>
  );
}
