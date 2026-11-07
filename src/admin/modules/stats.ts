import type { AdminModule } from "../types";

export const statsModule: AdminModule = { id: "stats", title: "Посещаемость", href: "/admin/stats", icon: "chart", order: 100, group: "analytics", permission: "stats" };
