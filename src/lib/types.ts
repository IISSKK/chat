export const ITEM_TYPES = ["car", "engine"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const CATEGORIES = ["standby", "listing", "running"] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["available", "sold", "draft"] as const;
/** Статусы, которые видны на сайте */
export const PUBLIC_STATUSES = ["available", "sold"] as const;
export type Status = (typeof STATUSES)[number];

export const FUELS = ["gasoline", "diesel", "hybrid", "lpg", "electric"] as const;
export type Fuel = (typeof FUELS)[number];

export const TRANSMISSIONS = ["automatic", "manual", "cvt", "dct"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

/** Тип кузова (только у автомобилей) */
export const BODIES = ["sedan", "hatchback", "wagon", "suv", "crossover", "minivan", "coupe", "convertible", "pickup", "truck", "van"] as const;
export type Body = (typeof BODIES)[number];

export const MAX_PHOTOS = 8;

export interface Photo {
  id: number;
  item_id: number;
  filename: string;
  position: number;
}

export interface Item {
  id: number;
  type: ItemType;
  category: Category;
  slug: string;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  first_registration: string;
  vin: string;
  serial: string;
  engine_code: string;
  displacement: number | null;
  transmission: string;
  mileage: number | null;
  fuel: string;
  /** Тип кузова (из BODIES) или пусто */
  body: string;
  notes: string;
  status: Status;
  /** Ссылка на видео (YouTube / Vimeo), необязательно */
  video_url: string;
  views: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  photos: Photo[];
}

export type ItemInput = Omit<Item, "id" | "slug" | "created_at" | "updated_at" | "photos" | "views" | "deleted_at">;

export interface ItemFilters {
  type?: ItemType;
  category?: Category;
  status?: Status;
  brand?: string;
  model?: string;
  /** Только для админки: показывать черновики */
  includeDrafts?: boolean;
  /** Только для админки: корзина */
  trash?: boolean;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  fuel?: string;
  transmission?: string;
  body?: string;
  q?: string;
}
