import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, checkCredentials, createSessionToken, sessionCookieOptions, sessionSecretOk } from "@/lib/auth";
import { authenticateAdmin, ownerUsername } from "@/lib/admins";
import { clientIp, lockedFor, registerFailure, registerSuccess } from "@/lib/login-limiter";

export async function POST(req: NextRequest) {
  const { user = "", password = "" } = (await req.json().catch(() => ({}))) as { user?: string; password?: string };
  const u = String(user).trim().slice(0, 64);
  const p = String(password).slice(0, 256);
  const ip = clientIp(req);

  const wait = lockedFor(u, ip);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Слишком много попыток. Повторите через ${Math.ceil(wait / 60_000)} мин.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(wait / 1000)) } },
    );
  }

  let session: { name: string; id: number } | null = null;
  if (sessionSecretOk()) {
    if (checkCredentials(u, p)) session = { name: ownerUsername(), id: 0 };
    else {
      const admin = authenticateAdmin(u, p);
      if (admin) session = { name: admin.username, id: admin.id };
    }
  }

  if (!session) {
    registerFailure(u, ip);
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
  registerSuccess(u, ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(session.name, session.id), sessionCookieOptions);
  return res;
}
