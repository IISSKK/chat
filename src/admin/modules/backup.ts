import type { AdminModule } from "../types";

export const backupModule: AdminModule = { id: "backup", title: "Резервная копия", href: "/admin/backup", icon: "download", order: 220, group: "settings", permission: "backup" };
