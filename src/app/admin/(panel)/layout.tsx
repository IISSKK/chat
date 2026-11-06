import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminModules, groupTitles } from "@/admin/registry";
import { AdminShell } from "@/components/admin/AdminShell";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  return (
    <AdminShell modules={getAdminModules()} groups={groupTitles} user={session.u}>
      {children}
    </AdminShell>
  );
}
