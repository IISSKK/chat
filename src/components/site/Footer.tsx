import Link from "@/components/site/LocLink";
import { siteConfig } from "@/config/site";
import { getT } from "@/i18n/server";
import { waOptions } from "@/lib/contacts";
import { Logo } from "./Logo";
import { VisitCounter } from "./VisitCounter";
import { ClockIcon, MailIcon, PinIcon, WhatsAppIcon } from "@/components/icons";

export async function Footer() {
  const t = await getT();
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-[#0B1220] text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-white/65">{t.meta.tagline}. {t.footer.worldwide}</p>
          <div className="flex flex-col items-start gap-2">
            {waOptions("generic", undefined, t.meta.code).map((o) => (
              <a key={o.href} href={o.href} target="_blank" rel="noopener nofollow" className="btn-wa justify-start py-2.5 text-left">
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>{o.phone}</span>
                  {o.name && <span className="text-[11px] font-medium opacity-85">{o.name}</span>}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/60">{t.footer.catalog}</h2>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li><Link className="hover:text-brand-400" href="/catalog/cars">{t.nav.cars}</Link></li>
            <li><Link className="hover:text-brand-400" href="/catalog/cars/standby">{t.categoriesLong.standby}</Link></li>
            <li><Link className="hover:text-brand-400" href="/catalog/cars/running">{t.categoriesLong.running}</Link></li>
            <li><Link className="hover:text-brand-400" href="/catalog/engines">{t.nav.engines}</Link></li>
            <li><Link className="hover:text-brand-400" href="/parts">{t.nav.parts}</Link></li>
            <li><Link className="hover:text-brand-400" href="/brand">{t.brandPage.brands}</Link></li>
            <li><Link className="hover:text-brand-400" href="/favorites">{t.fav.title}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/60">{t.footer.about}</h2>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex gap-2"><MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><a className="hover:text-brand-400" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></li>
            <li className="flex gap-2"><ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{t.meta.workHours}</li>
            <li className="flex gap-2"><PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{siteConfig.address}</li>
            <li><Link className="hover:text-brand-400" href="/about">{t.nav.about}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/60">{t.footer.visits}</h2>
          <VisitCounter />
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0B1220]">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/55 sm:flex-row">
          <span>© {year} {siteConfig.name}. {t.footer.rights}</span>
          <div className="flex gap-x-5">
            <Link href="/terms" className="inline-flex min-h-[44px] items-center text-white/70 hover:text-white">{t.footer.terms}</Link>
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-white/70 hover:text-white">{t.footer.privacy}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
