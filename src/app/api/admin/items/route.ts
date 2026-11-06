import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createItem } from "@/lib/items";
import { parseItemInput, resolvePhotos } from "@/lib/item-form";
import { requireApiPermission } from "@/lib/admin-guard";
import { permissionForType } from "@/admin/permissions";

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const { data, error } = parseItemInput(fd);
  if (!data) return NextResponse.json({ error }, { status: 400 });
  const admin = await requireApiPermission(permissionForType(data.type));
  if (admin instanceof NextResponse) return admin;
  try {
    const photos = await resolvePhotos(fd, []);
    const id = createItem(data, photos);
    revalidatePath("/", "layout");
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
