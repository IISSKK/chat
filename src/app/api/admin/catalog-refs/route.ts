import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { brandUsage, createBrand, createModel, deleteBrand, deleteModel, listBrands, modelUsage, renameBrand, renameModel } from "@/lib/catalog-refs";
import { requireApiPermission } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const admin = await requireApiPermission("cars");
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ brands: listBrands() });
}

/** Справочник марок и моделей: добавить / переименовать / удалить (удалить можно только неиспользуемое) */
export async function POST(req: NextRequest) {
  // Добавлять марки и модели из формы объявления могут и те, у кого есть только раздел «Двигатели»
  const admin = await requireApiPermission();
  if (admin instanceof NextResponse) return admin;
  if (!admin.permissions.has("cars") && !admin.permissions.has("engines")) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { action?: string; id?: number; brandId?: number; name?: string };
  let error: string | null | undefined = null;
  let result: unknown = {};
  switch (b.action) {
    case "addBrand": {
      const r = createBrand(String(b.name ?? ""));
      error = r.error;
      result = { brand: r.brand };
      if (r.brand) logAudit(admin.username, "brand_add", "brand", r.brand.id, r.brand.name);
      break;
    }
    case "addModel": {
      const r = createModel(Number(b.brandId), String(b.name ?? ""));
      error = r.error;
      result = { model: r.model };
      if (r.model) logAudit(admin.username, "model_add", "model", r.model.id, r.model.name);
      break;
    }
    case "renameBrand":
    case "renameModel":
    case "deleteBrand":
    case "deleteModel": {
      if (!admin.permissions.has("cars")) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
      const id = Number(b.id);
      if (b.action === "renameBrand") error = renameBrand(id, String(b.name ?? ""));
      else if (b.action === "renameModel") error = renameModel(id, String(b.name ?? ""));
      else if (b.action === "deleteBrand") error = deleteBrand(id);
      else error = deleteModel(id);
      if (!error) logAudit(admin.username, b.action, b.action.endsWith("Brand") ? "brand" : "model", id, String(b.name ?? ""));
      result = { usage: b.action.endsWith("Brand") ? brandUsage(id) : modelUsage(id) };
      break;
    }
    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
  if (error) return NextResponse.json({ error }, { status: 400 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ...(result as object), brands: listBrands() });
}
