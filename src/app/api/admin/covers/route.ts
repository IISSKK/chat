import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/lib/admin-guard";
import { clearCover, isCoverKind, setCover } from "@/lib/covers";
import { saveUpload, removeUploads } from "@/lib/uploads";
import { logAudit } from "@/lib/audit";

const need = (kind: "car" | "engine") => (kind === "car" ? "cars" : "engines");

/** Загрузить свою обложку раздела: multipart {kind, file} */
export async function POST(req: NextRequest) {
  const admin = await requireApiPermission();
  if (admin instanceof NextResponse) return admin;
  const fd = await req.formData().catch(() => null);
  const kind = fd?.get("kind");
  const file = fd?.get("file");
  if (!fd || !isCoverKind(kind) || !(file instanceof File) || !file.size) return NextResponse.json({ error: "Выберите картинку" }, { status: 400 });
  if (!admin.permissions.has(need(kind))) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  let name: string;
  try {
    name = await saveUpload(file);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    await setCover(kind, name);
  } catch (e) {
    await removeUploads([name]);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  logAudit(admin.username, "cover_set", kind);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

/** Вернуть автоматическую обложку: {kind} */
export async function DELETE(req: NextRequest) {
  const admin = await requireApiPermission();
  if (admin instanceof NextResponse) return admin;
  const body = (await req.json().catch(() => ({}))) as { kind?: string };
  if (!isCoverKind(body.kind)) return NextResponse.json({ error: "Неверный раздел" }, { status: 400 });
  if (!admin.permissions.has(need(body.kind))) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  await clearCover(body.kind);
  logAudit(admin.username, "cover_clear", body.kind);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
