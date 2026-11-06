/**
 * Глобальные настройки сайта. Название, контакты и номер WhatsApp меняются здесь
 * (или через переменные окружения, см. .env.example).
 */
export const siteConfig = {
  name: "Barakat Auto",
  shortName: "Barakat",
  url: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.WHATSAPP_NUMBER || "821000000000",
  whatsappDisplay: "+82 10-0000-0000",
  email: "sales@barakat-auto.com",
  phone: "+82 10-0000-0000",
  address: "Incheon, Republic of Korea",
  social: {
    telegram: "https://t.me/",
    facebook: "https://facebook.com/",
  },
  /** Плавающее окошко «онлайн / всего посетителей» */
  showLiveWidget: true,
};
// Слоган, график работы и все тексты интерфейса — в словарях src/i18n/dictionaries/*.ts
