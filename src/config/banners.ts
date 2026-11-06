/**
 * Слайды большого баннера на главной. Порядок = порядок показа.
 * image — картинка 1920×1000 (лучше JPG, тёмная слева, чтобы читался текст); положите файл в public/banners/.
 * title — строки заголовка; строка из accentLine будет выделена градиентом темы.
 */
export interface BannerSlide {
  id: string;
  eyebrow: string;
  title: string[];
  accentLine?: number;
  text: string;
  image: string;
  cta: { label: string; href: string };
  /** Вторая кнопка: WhatsApp с этим текстом */
  whatsappText?: string;
}

export const bannerSlides: BannerSlide[] = [
  {
    id: "export",
    eyebrow: "B2B экспорт из Южной Кореи",
    title: ["Корейские авто,", "двигатели и запчасти", "напрямую к вам"],
    accentLine: 1,
    text: "Проверенный инвентарь от корейских поставщиков. Подбор, документы, снятие с учёта и отгрузка в любую страну — под ключ.",
    image: "/banners/banner-1.jpg",
    cta: { label: "Смотреть автомобили", href: "/catalog/cars" },
    whatsappText: "Здравствуйте! Хочу подобрать автомобиль из Кореи.",
  },
  {
    id: "engines",
    eyebrow: "Контрактные моторы",
    title: ["Двигатели", "с гарантией", "запуска"],
    accentLine: 1,
    text: "Проверка компрессии, видео работы, полный пакет документов. Отгрузка от одной единицы — в сборе или без навесного.",
    image: "/banners/banner-2.jpg",
    cta: { label: "Каталог двигателей", href: "/catalog/engines" },
    whatsappText: "Здравствуйте! Интересуют контрактные двигатели.",
  },
  {
    id: "shipping",
    eyebrow: "Логистика под ключ",
    title: ["Отгрузка", "в 40+ стран", "контейнер и RoRo"],
    accentLine: 1,
    text: "Снятие с учёта, экспортная декларация, погрузка в портах Инчхон и Пусан, трекинг до порта назначения.",
    image: "/banners/banner-3.jpg",
    cta: { label: "Как мы работаем", href: "/about" },
    whatsappText: "Здравствуйте! Подскажите по доставке в мою страну.",
  },
];

/** Интервал автопрокрутки, мс */
export const BANNER_INTERVAL = 6500;
