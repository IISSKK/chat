import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { siteConfig } from "@/config/site";
import { getLocale, getT } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import type { Dictionary } from "@/i18n";
import "./globals.css";

/** Разделы словаря, которые нужны только серверу (страницы, тексты брендов и т. п.): в браузер они не отправляются */
const SERVER_ONLY = ["typeSingle", "categoriesLong", "advantages", "about", "catalog", "item", "brandPage", "misc", "parts", "legal"] as const;

function clientDictionary(t: Dictionary): Dictionary {
  const copy: Record<string, unknown> = { ...t };
  for (const k of SERVER_ONLY) copy[k] = Array.isArray(copy[k]) ? [] : {};
  return copy as unknown as Dictionary;
}

// Заголовки — Manrope (есть кириллица). Основной текст — системный шрифт телефона: он уже на устройстве и не грузится по сети.
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-display", display: "swap" });

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
    <html lang={locale === "zh" ? "zh-CN" : locale} className={manrope.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <I18nProvider locale={locale} t={clientDictionary(t)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
