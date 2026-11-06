/**
 * Глобальные настройки сайта. Название, контакты и номер WhatsApp меняются здесь
 * (или через переменные окружения, см. .env.example).
 */
export const siteConfig = {
  name: "Barakat Auto",
  shortName: "Barakat",
  tagline: "Автомобили и двигатели из Южной Кореи",
  url: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.WHATSAPP_NUMBER || "821000000000",
  whatsappDisplay: "+82 10-0000-0000",
  email: "sales@barakat-auto.com",
  phone: "+82 10-0000-0000",
  address: "Incheon, Republic of Korea",
  workHours: "Пн–Сб, 09:00–19:00 (KST, UTC+9)",
  social: {
    telegram: "https://t.me/",
    facebook: "https://facebook.com/",
  },
  /** Плавающее окошко «онлайн / всего посетителей» */
  showLiveWidget: true,
  defaultLocale: "ru" as const,
  locales: ["ru"] as const, // добавьте "en" после создания src/i18n/dictionaries/en.ts
};

export type Locale = "ru" | "en";
