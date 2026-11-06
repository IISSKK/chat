import { NextResponse, type NextRequest } from "next/server";
import { sanitizePermissions } from "@/admin/permissions";
import { createAdmin, listAdmins, validatePassword, validateUsername } from "@/lib/admins";
import { requireApiPermission } from "@/lib/admin-guard";

export async function GET() {
  const admin = await requireApiPermission("admins");
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ admins: listAdmins() });
}

export async function POST(req: NextRequest) {
  const admin = await requireApiPermission("admins");
  if (admin instanceof NextResponse) return admin;
  const body = (await req.json().catch(() => ({}))) as { username?: string; password?: string; permissions?: unknown };
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const error = validateUsername(username) || validatePassword(password);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (listAdmins().some((a) => a.username.toLowerCase() === username.toLowerCase()))
    return NextResponse.json({ error: "Такой логин уже есть" }, { status: 400 });
  const id = createAdmin(username, password, sanitizePermissions(body.permissions));
  return NextResponse.json({ id });
}
