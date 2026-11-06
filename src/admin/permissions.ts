/**
 * Права доступа администраторов. Владелец (ADMIN_USER из .env) всегда имеет все права.
 * Новое право = новая строка здесь; затем укажите его в модуле (AdminModule.permission) и проверьте в API.
 */
export const PERMISSIONS = [
  { id: "cars", label: "Автомобили", hint: "добавлять, изменять, менять статус" },
  { id: "engines", label: "Двигатели", hint: "добавлять, изменять, менять статус" },
  { id: "delete", label: "Удаление объявлений", hint: "в разделах, к которым есть доступ" },
  { id: "stats", label: "Статистика посещений", hint: "просмотр" },
  { id: "contacts", label: "Контакты", hint: "номера WhatsApp на сайте" },
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
