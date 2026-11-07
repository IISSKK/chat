import type { AdminModule } from "../types";

export const tasksModule: AdminModule = { id: "tasks", title: "Задачи по сайту", href: "/admin/tasks", icon: "list", order: 230, group: "settings", permission: "tasks" };
