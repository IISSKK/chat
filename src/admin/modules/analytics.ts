import type { AdminModule } from "../types";

export const analyticsModule: AdminModule = { id: "analytics", title: "Аналитика", href: "/admin/analytics", icon: "chart", order: 95, group: "analytics", permission: "stats" };
