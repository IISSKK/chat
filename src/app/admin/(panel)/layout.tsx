import { redirect } from "next/navigation";
import { getAdminModules, groupTitles } from "@/admin/registry";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <AdminShell
      modules={getAdminModules(admin.permissions)}
      groups={groupTitles}
      user={admin.isOwner ? `${admin.username} · владелец` : admin.username}
    >
      {children}
    </AdminShell>
  );
}
