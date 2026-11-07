import { NextResponse, type NextRequest } from "next/server";
import { checkCredentials, createTicket, sessionSecretOk } from "@/lib/auth";
import { getTwoFactor, ownerUsername, verifyAdminPassword } from "@/lib/admins";
import { clientIp, lockedFor, registerFailure, registerSuccess } from "@/lib/ratelimit";
import { finalizeLogin, describeDevice, countryOf } from "@/lib/admin-login";
import { logAudit } from "@/lib/audit";
import { sendTelegram, tgEscape } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { user = "", password = "" } = (await req.json().catch(() => ({}))) as { user?: string; password?: string };
  const u = String(user).trim().slice(0, 64);
  const p = String(password).slice(0, 256);
  const ip = clientIp(req);

  const wait = lockedFor("login", u, ip);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Слишком много попыток. Повторите через ${Math.ceil(wait / 60_000)} мин.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(wait / 1000)) } },
    );
  }

  let who: { name: string; id: number } | null = null;
  if (sessionSecretOk()) {
    if (checkCredentials(u, p)) who = { name: ownerUsername(), id: 0 };
    else {
      const admin = verifyAdminPassword(u, p);
      if (admin) who = { name: admin.username, id: admin.id };
    }
  }

  if (!who) {
    const locked = registerFailure("login", u, ip);
    logAudit(u || "?", "login_failed", "admin", "", `${describeDevice(req.headers.get("user-agent") || "")}${countryOf(req) ? ` · ${countryOf(req)}` : ""}`);
    if (locked) void sendTelegram(`⚠️ <b>Подбор пароля?</b>\nВход для «${tgEscape(u || "?")}» заблокирован после 5 неудачных попыток.\nУстройство: ${tgEscape(describeDevice(req.headers.get("user-agent") || ""))}${countryOf(req) ? `\nСтрана: ${countryOf(req)}` : ""}`);
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
  registerSuccess("login", u, ip);

  if (getTwoFactor(who.id).enabled) {
    return NextResponse.json({ need2fa: true, ticket: await createTicket(who.name, who.id) });
  }
  return finalizeLogin(req, who, false);
}
