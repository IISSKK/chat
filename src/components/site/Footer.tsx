import Link from "next/link";
import { siteConfig } from "@/config/site";
import { t } from "@/i18n";
import { waLink } from "@/lib/whatsapp";
import { Logo } from "./Logo";
import { VisitCounter } from "./VisitCounter";
import { ClockIcon, MailIcon, PinIcon, WhatsAppIcon } from "@/components/icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="cv-auto relative mt-24 border-t border-white/80 bg-white/55">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-fg/55">{siteConfig.tagline}. B2B экспорт по всему миру.</p>
          <a href={waLink(t.whatsapp.generic)} target="_blank" rel="noopener" className="btn-wa">
            <WhatsAppIcon className="h-4 w-4" /> {siteConfig.whatsappDisplay}
          </a>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-fg/40">{t.footer.catalog}</h3>
          <ul className="space-y-2.5 text-sm text-fg/70">
            <li><Link className="hover:text-brand" href="/catalog/cars">{t.nav.cars}</Link></li>
            <li><Link className="hover:text-brand" href="/catalog/cars/standby">{t.categoriesLong.standby}</Link></li>
            <li><Link className="hover:text-brand" href="/catalog/cars/running">{t.categoriesLong.running}</Link></li>
            <li><Link className="hover:text-brand" href="/catalog/engines">{t.nav.engines}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-fg/40">{t.footer.about}</h3>
          <ul className="space-y-3 text-sm text-fg/70">
            <li className="flex gap-2"><MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><a className="hover:text-brand" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></li>
            <li className="flex gap-2"><ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{siteConfig.workHours}</li>
            <li className="flex gap-2"><PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{siteConfig.address}</li>
            <li><Link className="hover:text-brand" href="/about">{t.nav.about}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-fg/40">{t.footer.visits}</h3>
          <VisitCounter />
        </div>
      </div>

      <div className="border-t border-fg/[0.06]">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-fg/40 sm:flex-row">
          <span>© {year} {siteConfig.name}. {t.footer.rights}</span>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-fg">{t.footer.terms}</Link>
            <Link href="/privacy" className="hover:text-fg">{t.footer.privacy}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
