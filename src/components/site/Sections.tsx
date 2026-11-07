import Link from "@/components/site/LocLink";
import { siteConfig } from "@/config/site";
import { getT } from "@/i18n/server";
import { waOptions } from "@/lib/contacts";
import { ArrowRight, CheckBadge, ClockIcon, DownloadIcon, MailIcon, PinIcon, RouteIcon, ShieldIcon, ShipIcon, WhatsAppIcon } from "@/components/icons";

export async function SectionTitle({ title, href, eyebrow }: { title: string; href?: string; eyebrow?: string }) {
  const t = await getT();
  return (
    <div data-reveal className="mb-6 flex items-end justify-between gap-3 sm:mb-8 sm:gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>}
        <h2 className="h-display break-words text-[1.9rem] leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group btn-ghost shrink-0 px-3 py-2.5 text-xs sm:px-4 sm:text-sm" aria-label={t.common.viewAll}>
          <span className="hidden min-[420px]:inline">{t.common.viewAll}</span><span className="min-[420px]:hidden">{t.common.allShort}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

const advIcons = [CheckBadge, ShieldIcon, ShipIcon, RouteIcon];
const advColors = ["from-brand/25 text-brand", "from-ember/30 text-ember-400", "from-glow/25 text-glow", "from-flame/25 text-flame-400"];

export async function Advantages() {
  const t = await getT();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {t.advantages.map((a, i) => {
        const Icon = advIcons[i % advIcons.length];
        return (
          <div
            key={a.title}
            data-reveal
            style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
            className="group relative overflow-hidden rounded-3xl surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-fg/15"
          >
            <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-transform duration-500 group-hover:scale-125 ${advColors[i]}`} />
            <div className={`relative mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-fg/[0.06] ${advColors[i].split(" ")[1]}`}>
              <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]" />
            </div>
            <h3 className="relative font-display text-lg font-bold">{a.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-fg/60">{a.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export const GUIDES = [
  { code: "RU", lang: "Русский", file: "/guides/buyer-guide-ru.pdf", flag: "🇷🇺" },
  { code: "EN", lang: "English", file: "/guides/buyer-guide-en.pdf", flag: "🇬🇧" },
  { code: "KO", lang: "한국어", file: "/guides/buyer-guide-ko.pdf", flag: "🇰🇷" },
  { code: "ZH", lang: "中文", file: "/guides/buyer-guide-zh.pdf", flag: "🇨🇳" },
  { code: "AR", lang: "العربية", file: "/guides/buyer-guide-ar.pdf", flag: "🇦🇪" },
];

export async function Guides({ wide = false }: { wide?: boolean }) {
  const t = await getT();
  return (
    <div className={`grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 ${wide ? "sm:grid-cols-3 lg:grid-cols-5" : ""}`}>
      {GUIDES.map((g, i) => (
        <a
          key={g.code}
          href={g.file}
          download
          data-reveal
          style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
          className="group flex items-center gap-3 rounded-2xl border border-fg/[0.08] bg-fg/[0.04] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:bg-fg/[0.07]"
        >
          <span className="text-2xl">{g.flag}</span>
          <span className="min-w-0 flex-1">
            <span className="block whitespace-nowrap font-display text-sm font-bold">PDF · {g.code}</span>
            <span className="block truncate text-xs text-fg/50">{g.lang}</span>
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition-transform duration-300 group-hover:translate-y-0.5 group-hover:scale-110">
            <DownloadIcon className="h-4 w-4" />
          </span>
        </a>
      ))}
    </div>
  );
}

export async function ContactCards() {
  const t = await getT();
  type Card = { icon: typeof WhatsAppIcon; label: string; value: string; href?: string; color: string };
  const cards: Card[] = [
    ...waOptions("generic", undefined, t.meta.code).map((o) => ({
      icon: WhatsAppIcon,
      label: o.name ? `WhatsApp · ${o.name}` : "WhatsApp",
      value: o.langs ? `${o.phone} · ${o.langs}` : o.phone,
      href: o.href,
      color: "text-[#25D366]",
    })),
    { icon: MailIcon, label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}`, color: "text-glow" },
    { icon: ClockIcon, label: t.footer.hours, value: t.meta.workHours, color: "text-brand" },
    { icon: PinIcon, label: t.common.address, value: siteConfig.address, color: "text-flame-400" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c, i) => {
        const Inner = (
          <>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-fg/[0.06] ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wider text-fg/40">{c.label}</span>
              <span className="block break-words font-semibold">{c.value}</span>
            </span>
          </>
        );
        const cls = "flex items-center gap-4 rounded-2xl surface p-4 transition-all duration-300";
        return c.href ? (
          <a key={c.href} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener" data-reveal style={{ "--d": `${i * 60}ms` } as React.CSSProperties} className={`${cls} hover:-translate-y-0.5 hover:border-fg/20`}>
            {Inner}
          </a>
        ) : (
          <div key={c.label + c.value} data-reveal style={{ "--d": `${i * 60}ms` } as React.CSSProperties} className={cls}>{Inner}</div>
        );
      })}
    </div>
  );
}
