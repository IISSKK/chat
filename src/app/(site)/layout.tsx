import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RevealObserver } from "@/components/site/Reveal";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { waLink } from "@/lib/whatsapp";
import { t } from "@/i18n";

function Background() {
  return (
    <div className="blobs" aria-hidden>
      <div className="blob animate-blob" style={{ width: "42vw", height: "42vw", left: "-10vw", top: "-8vw", background: "#7B5CFF" }} />
      <div className="blob animate-blob" style={{ width: "36vw", height: "36vw", right: "-8vw", top: "10vh", background: "#FF3D81", animationDelay: "-7s" }} />
      <div className="blob animate-blob" style={{ width: "30vw", height: "30vw", left: "30vw", top: "55vh", background: "#2EE6D6", opacity: 0.25, animationDelay: "-14s" }} />
    </div>
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const wa = waLink(t.whatsapp.generic);
  return (
    <>
      <Background />
      <Header waHref={wa} />
      <main className="relative">{children}</main>
      <Footer />
      <FloatingWhatsApp href={wa} />
      <RevealObserver />
    </>
  );
}
