import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getVisitStats, recordVisit } from "@/lib/visits";

export const dynamic = "force-dynamic";
const COOKIE = "korida_vid";
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless/i;

export async function POST(req: NextRequest) {
  let vid = req.cookies.get(COOKIE)?.value;
  const isNew = !vid || !/^[a-f0-9]{32}$/.test(vid);
  if (isNew) vid = crypto.randomBytes(16).toString("hex");
  if (!BOT.test(req.headers.get("user-agent") || "")) recordVisit(vid!);
  const res = NextResponse.json(getVisitStats());
  if (isNew) res.cookies.set(COOKIE, vid!, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export async function GET() {
  return NextResponse.json(getVisitStats());
}
