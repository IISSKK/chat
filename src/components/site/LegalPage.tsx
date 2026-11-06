export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string][] }) {
  return (
    <div className="container max-w-3xl pt-10 sm:pt-16">
      <h1 className="h-display text-3xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-fg/50">Редакция от {updated}</p>
      <div className="mt-10 space-y-4">
        {sections.map(([h, body], i) => (
          <section key={h} data-reveal className="rounded-3xl surface p-5 sm:p-7">
            <h2 className="font-display text-lg font-bold">
              <span className="mr-2 text-brand">{String(i + 1).padStart(2, "0")}</span>
              {h}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg/70">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
