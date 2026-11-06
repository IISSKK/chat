import type { AdminModule } from "../types";

export const contactsModule: AdminModule = { id: "contacts", title: "Контакты", href: "/admin/contacts", icon: "phone", order: 150, group: "settings", permission: "contacts" };
