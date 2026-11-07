import { NextResponse, type NextRequest } from "next/server";
import { deleteLead, updateLead } from "@/lib/leads";
import { requireApiPermission } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireApiPermission("leads");
  if (admin instanceof NextResponse) return admin;
  const id = Number((await ctx.params).id);
  const body = (await req.json().catch(() => ({}))) as { status?: string; note?: string };
  if (!Number.isInteger(id) || !updateLead(id, body)) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  logAudit(admin.username, "lead_update", "lead", id, [body.status && `статус: ${body.status}`, typeof body.note === "string" && "заметка"].filter(Boolean).join(", "));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await requireApiPermission("leads", "delete");
  if (admin instanceof NextResponse) return admin;
  const id = Number((await ctx.params).id);
  deleteLead(id);
  logAudit(admin.username, "lead_delete", "lead", id);
  return NextResponse.json({ ok: true });
}
