import type { AdminModule } from "../types";

export const brandsModule: AdminModule = { id: "brands", title: "Марки и модели", href: "/admin/brands", icon: "tag", order: 40, group: "content", permission: "cars" };
