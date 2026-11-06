import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getWhatsAppContacts, saveWhatsAppContacts } from "@/lib/contacts";
import { requireApiPermission } from "@/lib/admin-guard";

export async function GET() {
  const admin = await requireApiPermission("contacts");
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ contacts: getWhatsAppContacts() });
}

export async function PUT(req: NextRequest) {
  const admin = await requireApiPermission("contacts");
  if (admin instanceof NextResponse) return admin;
  const body = (await req.json().catch(() => ({}))) as { contacts?: unknown };
  const error = saveWhatsAppContacts(body.contacts);
  if (error) return NextResponse.json({ error }, { status: 400 });
  revalidatePath("/", "layout");
  return NextResponse.json({ contacts: getWhatsAppContacts() });
}
