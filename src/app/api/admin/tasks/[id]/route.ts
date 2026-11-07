import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/admin-guard";
import { deleteTask, updateTask } from "@/lib/tasks";
import { logAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

/** Менять статус, отвечать и удалять задачи может только владелец */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireApiPermission("tasks");
  if (admin instanceof NextResponse) return admin;
  if (!admin.isOwner) return NextResponse.json({ error: "Только владелец" }, { status: 403 });
  const id = Number((await ctx.params).id);
  const body = (await req.json().catch(() => ({}))) as { status?: string; reply?: string };
  if (!Number.isInteger(id) || !updateTask(id, body)) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  logAudit(admin.username, "task_update", "task", id, body.status ? `статус: ${body.status}` : "ответ");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await requireApiPermission("tasks");
  if (admin instanceof NextResponse) return admin;
  if (!admin.isOwner) return NextResponse.json({ error: "Только владелец" }, { status: 403 });
  const id = Number((await ctx.params).id);
  deleteTask(id);
  logAudit(admin.username, "task_delete", "task", id);
  return NextResponse.json({ ok: true });
}
