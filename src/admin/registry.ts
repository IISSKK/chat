/**
 * Реестр модулей админки.
 *
 * Как добавить новый раздел (например «Заявки»):
 *   1. Создайте src/admin/modules/leads.ts и экспортируйте AdminModule { id: "leads", href: "/admin/leads", ... }.
 *   2. Добавьте его в массив `modules` ниже — пункт меню появится автоматически.
 *   3. Создайте страницу src/app/admin/(panel)/leads/page.tsx (статический сегмент имеет приоритет над [resource]).
 * Новый раздел каталога (ещё один тип товаров) — просто добавьте запись в catalogModules: CRUD уже готов.
 */
import { catalogModules } from "./modules/catalog";
import { dashboardModule } from "./modules/dashboard";
import { statsModule } from "./modules/stats";
import type { AdminModule, ResourceModule } from "./types";

const modules: AdminModule[] = [dashboardModule, ...catalogModules, statsModule];

export function getAdminModules(): AdminModule[] {
  return [...modules].sort((a, b) => a.order - b.order);
}

export function getResource(id: string): ResourceModule | undefined {
  return catalogModules.find((m) => m.id === id);
}

export function getResourceByType(type: string): ResourceModule | undefined {
  return catalogModules.find((m) => m.itemType === type);
}

export const groupTitles: Record<AdminModule["group"], string> = {
  main: "",
  content: "Каталог",
  analytics: "Аналитика",
  settings: "Настройки",
};
