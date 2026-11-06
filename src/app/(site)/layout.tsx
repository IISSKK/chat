import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RevealObserver } from "@/components/site/Reveal";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { LiveWidget } from "@/components/site/LiveWidget";
import { siteConfig } from "@/config/site";
import { waLink } from "@/lib/whatsapp";
import { getT } from "@/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  const wa = waLink(t.whatsapp.generic);
  return (
    <>
      <div className="page-bg" aria-hidden />
      <Header waHref={wa} />
      <main className="relative">{children}</main>
      <Footer />
      <FloatingWhatsApp href={wa} />
      {siteConfig.showLiveWidget && <LiveWidget />}
      <RevealObserver />
    </>
  );
}
