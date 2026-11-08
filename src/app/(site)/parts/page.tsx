import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { alternatesFor } from "@/lib/seo";
import { waOptions } from "@/lib/contacts";
import { WaButton } from "@/components/site/WaButton";
import { CarIcon, ShieldIcon, WhatsAppIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.parts.title, description: t.parts.metaDescription, alternates: await alternatesFor("/parts") };
}

export default async function PartsPage() {
  const t = await getT();
  const groups = [
    { kind: "body" as const, title: t.parts.bodyTitle, text: t.parts.bodyText, items: t.parts.bodyItems, Icon: CarIcon, tint: "bg-brand/10 text-brand" },
    { kind: "chassis" as const, title: t.parts.chassisTitle, text: t.parts.chassisText, items: t.parts.chassisItems, Icon: ShieldIcon, tint: "bg-flame/10 text-flame" },
  ];
  return (
    <div className="container pb-8 pt-8 sm:pt-12">
      <h1 className="h-display text-3xl sm:text-5xl">{t.parts.title}</h1>
      <p className="mt-3 max-w-2xl text-fg/80">{t.parts.subtitle}</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {groups.map(({ kind, title, text, items, Icon, tint }, i) => (
          <section key={kind} className="flex flex-col rounded-4xl surface p-6 sm:p-8">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tint}`}>
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">{title}</h2>
            <p className="mt-1.5 text-sm text-fg/80">{text}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {items.map((x) => (
                <li key={x} className="rounded-full bg-fg/[0.09] px-3.5 py-1.5 text-sm font-medium text-fg/84">{x}</li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <WaButton chooseLabel={t.whatsapp.choose} options={waOptions(kind, undefined, t.meta.code)} placement="up" className="btn-wa w-full justify-center px-6 py-3.5 text-base sm:w-auto">
                <WhatsAppIcon /> {t.parts.ask}
              </WaButton>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-4xl surface p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold">{t.parts.howTitle}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.parts.steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <span className="pt-1 text-sm text-fg/84">{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
