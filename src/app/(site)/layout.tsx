import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { WaMenuCloser } from "@/components/site/WaMenuCloser";
import { LiveWidget } from "@/components/site/LiveWidget";
import { siteConfig } from "@/config/site";
import { waOptions } from "@/lib/contacts";
import { getT } from "@/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  const wa = waOptions("generic", undefined, t.meta.code);
  return (
    <>
      <div className="page-bg" aria-hidden />
      <Header wa={wa} />
      <main className="relative">{children}</main>
      <Footer />
      <FloatingWhatsApp options={wa} label={t.home.writeWhatsapp} chooseLabel={t.whatsapp.choose} />
      <WaMenuCloser />
      {siteConfig.showLiveWidget && <LiveWidget />}
    </>
  );
}
