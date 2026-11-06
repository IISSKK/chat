import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, checkCredentials, createSessionToken, sessionCookieOptions, sessionSecretOk } from "@/lib/auth";
import { authenticateAdmin, ownerUsername } from "@/lib/admins";

const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return NextResponse.json({ error: "Слишком много попыток. Подождите минуту." }, { status: 429 });
  const { user = "", password = "" } = (await req.json().catch(() => ({}))) as { user?: string; password?: string };
  const u = String(user).trim();
  const p = String(password);

  let session: { name: string; id: number } | null = null;
  if (sessionSecretOk()) {
    if (checkCredentials(u, p)) session = { name: ownerUsername(), id: 0 };
    else {
      const admin = authenticateAdmin(u, p);
      if (admin) session = { name: admin.username, id: admin.id };
    }
  }

  if (!session) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(session.name, session.id), sessionCookieOptions);
  return res;
}
