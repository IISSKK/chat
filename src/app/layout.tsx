import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import { getLocale } from "@/i18n";
import "./globals.css";

// Один вариативный шрифт вместо двух — меньше загрузки. На iPhone/Mac используется системный SF Pro.
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s · ${siteConfig.name}` },
  description:
    "B2B экспорт автомобилей и контрактных двигателей из Южной Кореи. Проверенный инвентарь, документы, таможня и отгрузка под ключ.",
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "ru_RU",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { title: siteConfig.name, statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#F0F4FA", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Включает анимации появления только при работающем JS */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
