import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getItemAny } from "@/lib/items";
import { queueAllMissing, queueTranslation, translationEnabled } from "@/lib/translate";
import { requireApiPermission } from "@/lib/admin-guard";
import { permissionForType } from "@/admin/permissions";
import { logAudit } from "@/lib/audit";
import { allow } from "@/lib/ratelimit";

/** Перевести объявление заново ({id}) или все без актуального перевода ({all: true}) */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { id?: number; all?: boolean };
  const disabled = () => NextResponse.json({ error: "Автоперевод выключен: на сервере не задан ANTHROPIC_API_KEY" }, { status: 400 });
  if (body.all) {
    const admin = await requireApiPermission("cars", "engines");
    if (admin instanceof NextResponse) return admin;
    if (!translationEnabled()) return disabled();
    if (!allow("translate-all", 3, 60 * 60_000)) return NextResponse.json({ error: "Слишком часто. Подождите немного." }, { status: 429 });
    const n = queueAllMissing();
    logAudit(admin.username, "translate_all", "", "", `в очередь: ${n}`);
    revalidatePath("/", "layout");
    return NextResponse.json({ queued: n });
  }
  const item = getItemAny(Number(body.id));
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const admin = await requireApiPermission(permissionForType(item.type));
  if (admin instanceof NextResponse) return admin;
  if (!translationEnabled()) return disabled();
  if (!allow(`translate:${admin.id}`, 20, 10 * 60_000)) return NextResponse.json({ error: "Слишком часто. Подождите немного." }, { status: 429 });
  queueTranslation(item.id, true);
  logAudit(admin.username, "translate", item.type, item.id, item.title);
  return NextResponse.json({ queued: 1 });
}
