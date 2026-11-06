import { AdminsManager } from "@/components/admin/AdminsManager";
import { PERMISSIONS } from "@/admin/permissions";
import { listAdmins, ownerUsername } from "@/lib/admins";
import { requirePagePermission } from "@/lib/admin-guard";

export default async function AdminsPage() {
  const me = await requirePagePermission("admins");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Администраторы</h1>
        <p className="text-sm text-slate-500">
          Добавляйте помощников и выдавайте им доступ только к нужным разделам. Изменения прав действуют сразу.
        </p>
      </div>
      <AdminsManager
        initial={listAdmins()}
        owner={ownerUsername()}
        meId={me.id}
        permissions={PERMISSIONS.map((p) => ({ id: p.id, label: p.label, hint: p.hint }))}
      />
    </div>
  );
}
