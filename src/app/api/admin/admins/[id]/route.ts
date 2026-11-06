import { NextResponse, type NextRequest } from "next/server";
import { sanitizePermissions } from "@/admin/permissions";
import { deleteAdmin, getAdmin, updateAdmin, validatePassword } from "@/lib/admins";
import { requireApiPermission } from "@/lib/admin-guard";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const me = await requireApiPermission("admins");
  if (me instanceof NextResponse) return me;
  const target = getAdmin(Number((await ctx.params).id));
  if (!target) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { permissions?: unknown; active?: boolean; password?: string };

  // Нельзя отнять у себя доступ к этому разделу или отключить самого себя — чтобы не потерять управление
  if (target.id === me.id) {
    if (body.active === false) return NextResponse.json({ error: "Нельзя отключить самого себя" }, { status: 400 });
    if (body.permissions && !sanitizePermissions(body.permissions).includes("admins"))
      return NextResponse.json({ error: "Нельзя снять с себя право «Администраторы»" }, { status: 400 });
  }
  if (body.password) {
    const err = validatePassword(body.password);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }
  updateAdmin(target.id, {
    permissions: body.permissions !== undefined ? sanitizePermissions(body.permissions) : undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
    password: body.password || undefined,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const me = await requireApiPermission("admins");
  if (me instanceof NextResponse) return me;
  const id = Number((await ctx.params).id);
  if (id === me.id) return NextResponse.json({ error: "Нельзя удалить самого себя" }, { status: 400 });
  if (!getAdmin(id)) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  deleteAdmin(id);
  return NextResponse.json({ ok: true });
}
