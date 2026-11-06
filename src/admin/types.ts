import type { ItemType } from "@/lib/types";
import type { Permission } from "./permissions";

export type AdminIcon = "dashboard" | "car" | "engine" | "chart" | "inbox" | "image" | "text" | "users" | "phone";

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
  /** Какое право нужно, чтобы видеть раздел (нет — доступен всем админам) */
  permission?: Permission;
}

/** Раздел-«ресурс» каталога: общий CRUD для товаров определённого типа. */
export interface ResourceModule extends AdminModule {
  kind: "resource";
  itemType: ItemType;
  singular: string;
}
