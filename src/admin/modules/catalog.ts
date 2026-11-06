import type { ResourceModule } from "../types";

/** Три раздела каталога работают через один универсальный CRUD (/admin/[resource]). */
export const catalogModules: ResourceModule[] = [
  { kind: "resource", id: "cars", itemType: "car", title: "Автомобили", singular: "автомобиль", href: "/admin/cars", icon: "car", order: 10, group: "content" },
  { kind: "resource", id: "engines", itemType: "engine", title: "Двигатели", singular: "двигатель", href: "/admin/engines", icon: "engine", order: 20, group: "content" },
  { kind: "resource", id: "parts", itemType: "part", title: "Запчасти для двигателей", singular: "запчасть", href: "/admin/parts", icon: "part", order: 30, group: "content" },
];
