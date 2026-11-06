import "server-only";
import crypto from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const VISITOR_COOKIE = "bk_vid";
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse/i;

/** Анонимный идентификатор посетителя из cookie (или новый). */
export function getVisitor(req: NextRequest) {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  const valid = !!existing && /^[a-f0-9]{32}$/.test(existing);
  return {
    id: valid ? existing! : crypto.randomBytes(16).toString("hex"),
    isNew: !valid,
    isBot: BOT.test(req.headers.get("user-agent") || ""),
  };
}

export function persistVisitor(res: NextResponse, v: { id: string; isNew: boolean }) {
  if (v.isNew) res.cookies.set(VISITOR_COOKIE, v.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
