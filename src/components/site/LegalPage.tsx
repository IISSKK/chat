import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/format";

export async function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; p: string }[] }) {
  const t = await getT();
  return (
    <div className="container max-w-3xl pt-10 sm:pt-16">
      <h1 className="h-display text-3xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-fg/72">{fmt(t.legal.edition, { date: updated })}</p>
      <div className="mt-10 space-y-4">
        {sections.map(({ h, p: body }, i) => (
          <section key={h} {...(i >= 2 ? { "data-reveal": true } : {})} className="rounded-3xl surface p-5 sm:p-7">
            <h2 className="font-display text-lg font-bold">
              <span className="mr-2 text-brand">{String(i + 1).padStart(2, "0")}</span>
              {h}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg/80">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
