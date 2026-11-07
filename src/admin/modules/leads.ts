import type { AdminModule } from "../types";

export const leadsModule: AdminModule = { id: "leads", title: "Заявки", href: "/admin/leads", icon: "leads", order: 5, group: "main", permission: "leads" };
