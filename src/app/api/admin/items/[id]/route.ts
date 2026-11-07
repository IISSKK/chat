import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteItem, getItemAny, restoreItem, setStatus, trashItem, updateItem } from "@/lib/items";
import { parseItemInput, resolvePhotos } from "@/lib/item-form";
import { removeUploads } from "@/lib/uploads";
import { requireApiPermission } from "@/lib/admin-guard";
import { permissionForType } from "@/admin/permissions";
import { logAudit } from "@/lib/audit";
import { queueTranslation } from "@/lib/translate";
import { STATUSES } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

async function load(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  return Number.isInteger(id) ? getItemAny(id) : null;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const item = await load(ctx);
  if (!item || item.deleted_at) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const fd = await req.formData();
  const { data, error } = parseItemInput(fd);
  if (!data) return NextResponse.json({ error }, { status: 400 });
  // Нужно право и на текущий раздел объявления, и на новый (если тип меняется)
  const admin = await requireApiPermission(permissionForType(item.type), permissionForType(data.type));
  if (admin instanceof NextResponse) return admin;
  try {
    const before = item.photos.map((p) => p.filename);
    const photos = await resolvePhotos(fd, before);
    updateItem(item.id, data, photos);
    await removeUploads(before.filter((f) => !photos.includes(f)));
    const changes = [item.status !== data.status && `статус ${item.status}→${data.status}`, item.title !== data.title && "название"].filter(Boolean).join(", ");
    logAudit(admin.username, "item_update", item.type, item.id, `${data.title}${changes ? ` (${changes})` : ""}`);
    queueTranslation(item.id);
    revalidatePath("/", "layout");
    return NextResponse.json({ id: item.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

/** Быстрая смена статуса / восстановление из корзины */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const item = await load(ctx);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const admin = await requireApiPermission(permissionForType(item.type));
  if (admin instanceof NextResponse) return admin;
  const body = (await req.json().catch(() => ({}))) as { status?: string; action?: string };
  if (body.action === "restore") {
    restoreItem(item.id);
    logAudit(admin.username, "item_restore", item.type, item.id, item.title);
  } else if (body.status && (STATUSES as readonly string[]).includes(body.status)) {
    if (item.deleted_at) return NextResponse.json({ error: "Объявление в корзине" }, { status: 400 });
    setStatus(item.id, body.status as (typeof STATUSES)[number]);
    logAudit(admin.username, "item_status", item.type, item.id, `${item.title}: ${item.status}→${body.status}`);
  } else return NextResponse.json({ error: "Bad request" }, { status: 400 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

/** Обычное удаление — в корзину (30 дней можно вернуть). Навсегда — только из корзины и с правом «Удаление навсегда». */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const item = await load(ctx);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const permanent = req.nextUrl.searchParams.get("permanent") === "1";
  const admin = await requireApiPermission(permissionForType(item.type), ...(permanent ? (["delete"] as const) : []));
  if (admin instanceof NextResponse) return admin;
  if (permanent) {
    if (!item.deleted_at) return NextResponse.json({ error: "Сначала переместите в корзину" }, { status: 400 });
    const files = deleteItem(item.id);
    await removeUploads(files);
    logAudit(admin.username, "item_purge", item.type, item.id, item.title);
  } else {
    if (item.deleted_at) return NextResponse.json({ ok: true });
    trashItem(item.id);
    logAudit(admin.username, "item_trash", item.type, item.id, item.title);
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
