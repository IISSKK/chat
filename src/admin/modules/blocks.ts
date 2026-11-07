import type { AdminModule } from "../types";

export const blocksModule: AdminModule = { id: "blocks", title: "Блокировки входа", href: "/admin/blocks", icon: "shield", order: 230, group: "settings", permission: "blocks" };
