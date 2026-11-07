import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import { getLocale, getT } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import type { Dictionary } from "@/i18n";
import "./globals.css";

/** В браузер отправляем словарь без длинных текстов, которые рендерятся только на сервере (юр. страницы, «О нас» и т. п.) */
function clientDictionary(t: Dictionary): Dictionary {
  return { ...t, legal: { ...t.legal, terms: [], privacy: [] }, advantages: [], about: { ...t.about, lead: "", partnershipText: "" } };
}

// Один вариативный шрифт вместо двух — меньше загрузки. На iPhone/Mac используется системный SF Pro.
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: `${siteConfig.name} — ${t.meta.tagline}`, template: `%s · ${siteConfig.name}` },
    description: t.meta.description,
    applicationName: siteConfig.name,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: t.meta.ogLocale,
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { title: siteConfig.name, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = { themeColor: "#F0F4FA", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getT();
  return (
    <html lang={locale === "zh" ? "zh-CN" : locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Включает анимации появления только при работающем JS */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <I18nProvider locale={locale} t={clientDictionary(t)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
