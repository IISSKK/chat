import type { ResourceModule } from "../types";

/** Разделы каталога работают через один универсальный CRUD (/admin/[resource]). */
export const catalogModules: ResourceModule[] = [
  { kind: "resource", id: "cars", itemType: "car", title: "Автомобили", singular: "автомобиль", href: "/admin/cars", icon: "car", permission: "cars", order: 10, group: "content" },
  { kind: "resource", id: "engines", itemType: "engine", title: "Двигатели", singular: "двигатель", href: "/admin/engines", icon: "engine", permission: "engines", order: 20, group: "content" },
];
