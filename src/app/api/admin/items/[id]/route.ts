import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteItem, getItem, setStatus, updateItem } from "@/lib/items";
import { parseItemInput, resolvePhotos } from "@/lib/item-form";
import { removeUploads } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

async function load(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  return Number.isInteger(id) ? getItem(id) : null;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const item = await load(ctx);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const fd = await req.formData();
  const { data, error } = parseItemInput(fd);
  if (!data) return NextResponse.json({ error }, { status: 400 });
  try {
    const before = item.photos.map((p) => p.filename);
    const photos = await resolvePhotos(fd, before);
    updateItem(item.id, data, photos);
    await removeUploads(before.filter((f) => !photos.includes(f)));
    revalidatePath("/", "layout");
    return NextResponse.json({ id: item.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const item = await load(ctx);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (status !== "available" && status !== "sold") return NextResponse.json({ error: "Bad status" }, { status: 400 });
  setStatus(item.id, status);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, status });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const item = await load(ctx);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const files = deleteItem(item.id);
  await removeUploads(files);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
