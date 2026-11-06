import type { ItemType } from "@/lib/types";

export type AdminIcon = "dashboard" | "car" | "engine" | "part" | "chart" | "inbox" | "image" | "text" | "users" | "phone";

/** Описание раздела админки (пункт бокового меню). */
export interface AdminModule {
  id: string;
  title: string;
  href: string;
  icon: AdminIcon;
  /** Порядок в меню (меньше — выше) */
  order: number;
  /** Группа в меню: "content" | "analytics" | "settings" … */
  group: "main" | "content" | "analytics" | "settings";
}

/** Раздел-«ресурс» каталога: общий CRUD для товаров определённого типа. */
export interface ResourceModule extends AdminModule {
  kind: "resource";
  itemType: ItemType;
  singular: string;
}
