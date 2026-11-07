/**
 * Реестр модулей админки.
 *
 * Как добавить новый раздел (например «Заявки»):
 *   1. Создайте src/admin/modules/leads.ts и экспортируйте AdminModule { id: "leads", href: "/admin/leads", ... }.
 *   2. Добавьте его в массив `modules` ниже — пункт меню появится автоматически.
 *      Укажите permission (src/admin/permissions.ts), чтобы раздел видели только админы с этим правом.
 *   3. Создайте страницу src/app/admin/(panel)/leads/page.tsx (статический сегмент имеет приоритет над [resource]).
 * Новый раздел каталога (ещё один тип товаров) — просто добавьте запись в catalogModules: CRUD уже готов.
 */
import { catalogModules } from "./modules/catalog";
import { dashboardModule } from "./modules/dashboard";
import { statsModule } from "./modules/stats";
import { adminsModule } from "./modules/admins";
import { contactsModule } from "./modules/contacts";
import { leadsModule } from "./modules/leads";
import { analyticsModule } from "./modules/analytics";
import { auditModule } from "./modules/audit";
import { backupModule } from "./modules/backup";
import { brandsModule } from "./modules/brands";
import { blocksModule } from "./modules/blocks";
import { accountModule } from "./modules/account";
import type { Permission } from "./permissions";
import type { AdminModule, ResourceModule } from "./types";

const modules: AdminModule[] = [dashboardModule, leadsModule, ...catalogModules, brandsModule, statsModule, analyticsModule, contactsModule, adminsModule, auditModule, backupModule, blocksModule, accountModule];

/** Модули, доступные администратору с данным набором прав */
export function getAdminModules(perms?: Set<Permission>): AdminModule[] {
  return modules.filter((m) => !m.permission || !perms || perms.has(m.permission)).sort((a, b) => a.order - b.order);
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
