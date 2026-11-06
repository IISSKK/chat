import { NextResponse, type NextRequest } from "next/server";
import { suggest } from "@/lib/items";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").slice(0, 60);
  return NextResponse.json({ results: suggest(q) });
}
