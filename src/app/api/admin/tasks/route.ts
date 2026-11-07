import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/admin-guard";
import { createTask } from "@/lib/tasks";
import { logAudit } from "@/lib/audit";
import { allow } from "@/lib/ratelimit";
import { sendTelegram, tgEscape } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const admin = await requireApiPermission("tasks");
  if (admin instanceof NextResponse) return admin;
  if (!allow(`task:${admin.username}`, 20, 3600_000)) return NextResponse.json({ error: "Слишком много задач за час" }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const id = createTask(admin.username, typeof body.text === "string" ? body.text : "");
  if (!id) return NextResponse.json({ error: "Напишите задачу (минимум 3 символа)" }, { status: 400 });
  logAudit(admin.username, "task_create", "task", id);
  void sendTelegram(`📝 <b>Новая задача по сайту</b> от ${tgEscape(admin.username)}\n${tgEscape(String(body.text).slice(0, 400))}`);
  return NextResponse.json({ ok: true, id });
}
