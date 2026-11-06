import type { AdminModule } from "../types";

export const adminsModule: AdminModule = { id: "admins", title: "Администраторы", href: "/admin/admins", icon: "users", order: 200, group: "settings", permission: "admins" };
