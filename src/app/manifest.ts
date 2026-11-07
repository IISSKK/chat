import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Манифест веб-приложения: сайт можно установить на экран телефона как приложение (PWA) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: "Cars and engines from South Korea",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F0F4FA",
    theme_color: "#007AFF",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
