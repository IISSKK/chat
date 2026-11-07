/**
 * Права доступа администраторов. Владелец (ADMIN_USER из .env) всегда имеет все права.
 * Новое право = новая строка здесь; затем укажите его в модуле (AdminModule.permission) и проверьте в API.
 */
export const PERMISSIONS = [
  { id: "cars", label: "Автомобили", hint: "добавлять, изменять, менять статус" },
  { id: "engines", label: "Двигатели", hint: "добавлять, изменять, менять статус" },
  { id: "delete", label: "Удаление навсегда", hint: "окончательно удалять из корзины (в корзину могут перемещать все)" },
  { id: "leads", label: "Заявки", hint: "просматривать и вести заявки клиентов" },
  { id: "stats", label: "Статистика и аналитика", hint: "посещения, просмотры, клики WhatsApp" },
  { id: "contacts", label: "Контакты", hint: "номера WhatsApp на сайте" },
  { id: "audit", label: "Журнал действий", hint: "кто и что менял на сайте" },
  { id: "backup", label: "Резервные копии", hint: "скачивать копию базы и фото" },
  { id: "tasks", label: "Задачи по сайту", hint: "писать короткие задачи на доработку сайта разработчику" },
  { id: "admins", label: "Администраторы", hint: "добавлять админов и менять их права" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["id"];
export const ALL_PERMISSIONS: Permission[] = PERMISSIONS.map((p) => p.id);

export function sanitizePermissions(input: unknown): Permission[] {
  if (!Array.isArray(input)) return [];
  return ALL_PERMISSIONS.filter((p) => input.includes(p));
}

/** Право, нужное для работы с объявлениями данного типа */
export const permissionForType = (type: string): Permission => (type === "engine" ? "engines" : "cars");
