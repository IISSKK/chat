import { NextResponse, type NextRequest } from "next/server";
import { suggest } from "@/lib/items";
import { allowRequest } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!allowRequest(req, "suggest", 120, 60_000)) return NextResponse.json({ results: [] }, { status: 429 });
  const q = (req.nextUrl.searchParams.get("q") || "").slice(0, 60);
  return NextResponse.json({ results: suggest(q) });
}
