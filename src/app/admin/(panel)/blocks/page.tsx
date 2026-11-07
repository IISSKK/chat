import { requirePagePermission } from "@/lib/admin-guard";
import { listBlocks } from "@/lib/blocks";
import { BlocksList } from "@/components/admin/BlocksList";

export const dynamic = "force-dynamic";

export default async function BlocksPage() {
  await requirePagePermission("blocks");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Блокировки входа</h1>
        <p className="text-sm text-slate-500">
          После 5 неверных попыток вход закрывается на 1–15 минут. Здесь видно, кто сейчас заблокирован: если это администратор, показано его имя. Блокировку можно снять вручную.
        </p>
      </div>
      <BlocksList initial={listBlocks()} />
    </div>
  );
}
