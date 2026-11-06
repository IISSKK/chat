import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { siteConfig } from "@/config/site";
import { getLocale } from "@/i18n";
import "./globals.css";

const display = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-display", weight: ["500", "700", "800"], display: "swap" });
const sans = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s · ${siteConfig.name}` },
  description:
    "B2B экспорт автомобилей, контрактных двигателей и запчастей из Южной Кореи. Проверенный инвентарь, документы, таможня и отгрузка под ключ.",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "ru_RU",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0A0A12", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
