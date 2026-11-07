import { requirePagePermission } from "@/lib/admin-guard";
import { listTasks } from "@/lib/tasks";
import { TasksBoard } from "@/components/admin/TasksBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const me = await requirePagePermission("tasks");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Задачи по сайту</h1>
        <p className="text-sm text-slate-500">Напишите коротко, что нужно изменить или добавить. Задача придёт владельцу в Telegram и сохранится здесь со статусом.</p>
      </div>
      <TasksBoard tasks={listTasks()} isOwner={me.isOwner} />
    </div>
  );
}
