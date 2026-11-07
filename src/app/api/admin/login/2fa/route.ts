import { NextResponse, type NextRequest } from "next/server";
import { verifyTicket } from "@/lib/auth";
import { consumeRecoveryCode, getLastTotpStep, getTwoFactor, setLastTotpStep } from "@/lib/admins";
import { clientIp, lockedFor, registerFailure, registerSuccess } from "@/lib/ratelimit";
import { finalizeLogin, describeDevice, countryOf } from "@/lib/admin-login";
import { logAudit } from "@/lib/audit";
import { verifyTotp } from "@/lib/totp";
import { sendTelegram, tgEscape } from "@/lib/telegram";

/** Второй шаг входа: код из приложения-аутентификатора (или резервный код). */
export async function POST(req: NextRequest) {
  const { ticket = "", code = "" } = (await req.json().catch(() => ({}))) as { ticket?: string; code?: string };
  const t = await verifyTicket(String(ticket));
  if (!t) return NextResponse.json({ error: "Время вышло. Введите логин и пароль заново.", expired: true }, { status: 401 });
  const id = t.id ?? 0;
  const ip = clientIp(req);

  const wait = lockedFor("2fa", t.u, ip);
  if (wait > 0) return NextResponse.json({ error: `Слишком много попыток. Повторите через ${Math.ceil(wait / 60_000)} мин.` }, { status: 429, headers: { "Retry-After": String(Math.ceil(wait / 1000)) } });

  const st = getTwoFactor(id);
  if (!st.enabled) return NextResponse.json({ error: "Двухфакторная защита не включена", expired: true }, { status: 400 });
  if (!st.secret) return NextResponse.json({ error: "Секрет 2FA не читается (возможно, менялся SESSION_SECRET). Сбросьте 2FA командой на сервере: npm run admin:reset-2fa" }, { status: 500 });

  const raw = String(code).trim().slice(0, 32);
  let ok = false;
  let usedRecovery = false;
  if (/^\d{3}\s?\d{3}$/.test(raw)) {
    const v = verifyTotp(st.secret, raw, getLastTotpStep(id));
    if (v.ok) {
      setLastTotpStep(id, v.step);
      ok = true;
    }
  } else if (raw.length >= 8 && consumeRecoveryCode(id, raw)) {
    ok = true;
    usedRecovery = true;
  }

  if (!ok) {
    const locked = registerFailure("2fa", t.u, ip);
    logAudit(t.u, "2fa_failed", "admin", id, describeDevice(req.headers.get("user-agent") || ""));
    if (locked) void sendTelegram(`⚠️ <b>Неверные коды 2FA</b>\nДля «${tgEscape(t.u)}» вход заблокирован после 5 ошибок.${countryOf(req) ? `\nСтрана: ${countryOf(req)}` : ""}`);
    return NextResponse.json({ error: "Неверный код" }, { status: 401 });
  }
  registerSuccess("2fa", t.u, ip);
  if (usedRecovery) {
    logAudit(t.u, "2fa_recovery_used", "admin", id, `осталось кодов: ${getTwoFactor(id).recoveryHashes.length}`);
    void sendTelegram(`ℹ️ <b>Использован резервный код 2FA</b> для «${tgEscape(t.u)}». Осталось: ${getTwoFactor(id).recoveryHashes.length}.`);
  }
  return finalizeLogin(req, { name: t.u, id }, true);
}
