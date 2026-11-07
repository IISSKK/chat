import type { AdminModule } from "../types";

export const auditModule: AdminModule = { id: "audit", title: "Журнал действий", href: "/admin/audit", icon: "list", order: 210, group: "settings", permission: "audit" };
