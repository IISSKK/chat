export const ITEM_TYPES = ["car", "engine", "part"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const CATEGORIES = ["standby", "listing", "running"] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["available", "sold"] as const;
export type Status = (typeof STATUSES)[number];

export const FUELS = ["gasoline", "diesel", "hybrid", "lpg", "electric"] as const;
export type Fuel = (typeof FUELS)[number];

export const TRANSMISSIONS = ["automatic", "manual", "cvt", "dct"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

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
  notes: string;
  status: Status;
  created_at: string;
  updated_at: string;
  photos: Photo[];
}

export type ItemInput = Omit<Item, "id" | "slug" | "created_at" | "updated_at" | "photos">;

export interface ItemFilters {
  type?: ItemType;
  category?: Category;
  status?: Status;
  brand?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  fuel?: string;
  transmission?: string;
  q?: string;
}
