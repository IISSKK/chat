import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/admin-guard";
import { listBlocks, unblock } from "@/lib/blocks";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const admin = await requireApiPermission("blocks");
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ blocks: listBlocks() });
}

/** { key } — снять одну блокировку, { all: true } — все */
export async function POST(req: NextRequest) {
  const admin = await requireApiPermission("blocks");
  if (admin instanceof NextResponse) return admin;
  const body = (await req.json().catch(() => ({}))) as { key?: string; all?: boolean };
  if (!body.all && typeof body.key !== "string") return NextResponse.json({ error: "Не указано, что разблокировать" }, { status: 400 });
  const n = body.all ? unblock() : unblock(body.key);
  logAudit(admin.username, "block_unlock", "block", "", body.all ? `все (${n})` : String(body.key).slice(0, 100));
  return NextResponse.json({ ok: true, removed: n });
}
