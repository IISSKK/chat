import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, checkCredentials, createSessionToken, sessionCookieOptions } from "@/lib/auth";

const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return NextResponse.json({ error: "Слишком много попыток. Подождите минуту." }, { status: 429 });
  const { user = "", password = "" } = (await req.json().catch(() => ({}))) as { user?: string; password?: string };
  if (!checkCredentials(String(user), String(password))) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(String(user)), sessionCookieOptions);
  return res;
}
