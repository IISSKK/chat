import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { SESSION_COOKIE } from "@/lib/auth";
import { changeOwnPassword, disableTwoFactor, enableTwoFactor, getLastTotpStep, getTwoFactor, regenerateRecoveryCodes, revokeSessions, setLastTotpStep, stageTwoFactorSecret } from "@/lib/admins";
import { requireApiSession, twoFactorRequired } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { sendTelegram, tgEscape } from "@/lib/telegram";
import { generateTotpSecret, otpauthUri, verifyTotp } from "@/lib/totp";
import { siteConfig } from "@/config/site";
import { allow } from "@/lib/ratelimit";

/** «Мой аккаунт»: двухфакторная защита, пароль, выход на всех устройствах */
export async function POST(req: NextRequest) {
  const me = await requireApiSession();
  if (me instanceof NextResponse) return me;
  if (!allow(`account:${me.id}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Слишком много попыток, подождите" }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; code?: string; current?: string; next?: string };
  const st = getTwoFactor(me.id);

  const checkCode = (code: string | undefined) => {
    if (!st.secret || !st.enabled) return false;
    const v = verifyTotp(st.secret, String(code ?? ""), getLastTotpStep(me.id));
    if (v.ok) setLastTotpStep(me.id, v.step);
    return v.ok;
  };

  switch (body.action) {
    case "begin2fa": {
      if (st.enabled) return NextResponse.json({ error: "2FA уже включена" }, { status: 400 });
      const secret = generateTotpSecret();
      stageTwoFactorSecret(me.id, secret);
      const uri = otpauthUri(secret, me.username, siteConfig.name);
      return NextResponse.json({ secret, uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 240 }) });
    }
    case "confirm2fa": {
      if (st.enabled || !st.secret) return NextResponse.json({ error: "Сначала начните настройку" }, { status: 400 });
      const v = verifyTotp(st.secret, String(body.code ?? ""), 0);
      if (!v.ok) return NextResponse.json({ error: "Код не подошёл. Проверьте время на телефоне и попробуйте новый код." }, { status: 400 });
      setLastTotpStep(me.id, v.step);
      const codes = enableTwoFactor(me.id);
      revokeSessions(me.id); // старые сессии без 2FA закрываем; текущую перевыдаст «Войти» — поэтому ниже просим перезайти
      logAudit(me.username, "2fa_enabled", "admin", me.id);
      void sendTelegram(`🛡 Двухфакторная защита <b>включена</b> для «${tgEscape(me.username)}».`);
      return NextResponse.json({ codes, relogin: true });
    }
    case "disable2fa": {
      if (!st.enabled) return NextResponse.json({ error: "2FA не включена" }, { status: 400 });
      if (twoFactorRequired()) return NextResponse.json({ error: "Двухфакторная защита обязательна на этом сайте (REQUIRE_2FA)" }, { status: 400 });
      if (!checkCode(body.code)) return NextResponse.json({ error: "Неверный код" }, { status: 400 });
      disableTwoFactor(me.id);
      logAudit(me.username, "2fa_disabled", "admin", me.id);
      void sendTelegram(`⚠️ Двухфакторная защита <b>отключена</b> для «${tgEscape(me.username)}».`);
      return NextResponse.json({ ok: true });
    }
    case "recovery": {
      if (!checkCode(body.code)) return NextResponse.json({ error: "Неверный код" }, { status: 400 });
      logAudit(me.username, "2fa_recovery_regenerated", "admin", me.id);
      return NextResponse.json({ codes: regenerateRecoveryCodes(me.id) });
    }
    case "password": {
      if (me.isOwner) return NextResponse.json({ error: "Пароль владельца задаётся в настройках сервера (ADMIN_PASSWORD)" }, { status: 400 });
      const err = changeOwnPassword(me.id, String(body.current ?? ""), String(body.next ?? ""));
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      logAudit(me.username, "password_changed", "admin", me.id);
      const res = NextResponse.json({ ok: true, relogin: true });
      res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
    case "logout_all": {
      revokeSessions(me.id);
      logAudit(me.username, "logout_all", "admin", me.id);
      const res = NextResponse.json({ ok: true });
      res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
}
