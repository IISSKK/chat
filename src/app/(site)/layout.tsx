import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RevealObserver } from "@/components/site/Reveal";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { WaMenuCloser } from "@/components/site/WaMenuCloser";
import { LiveWidget } from "@/components/site/LiveWidget";
import { siteConfig } from "@/config/site";
import { waOptions } from "@/lib/contacts";
import { getT } from "@/i18n/server";

/** Показ блоков при прокрутке стартует сразу после разбора страницы, не дожидаясь загрузки React: иначе первый экран остаётся прозрачным до конца гидрации */
const EARLY_REVEAL = `(function(){var q='[data-reveal]:not(.is-visible)';try{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});document.querySelectorAll(q).forEach(function(el){io.observe(el)})}catch(e){document.querySelectorAll('[data-reveal]').forEach(function(el){el.classList.add('is-visible')})}})()`;

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
      <script dangerouslySetInnerHTML={{ __html: EARLY_REVEAL }} />
      <RevealObserver />
    </>
  );
}
