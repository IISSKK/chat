"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function api(body: unknown) {
  const res = await fetch("/api/admin/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AccountPanel({ twoFactor, recoveryLeft, isOwner, required }: { twoFactor: boolean; recoveryLeft: number; isOwner: boolean; required: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });

  const run = async (body: unknown, onOk: (d: any) => void) => {
    setBusy(true);
    setMsg(null);
    const { ok, data } = await api(body);
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: data.error || "Ошибка" });
    onOk(data);
  };

  const relogin = () => {
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {msg && <p className={`animate-fade-in rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}

      {/* Резервные коды после включения */}
      {codes && (
        <section className="a-card animate-fade-up space-y-3 border-amber-300 p-5">
          <h2 className="font-semibold">Сохраните резервные коды</h2>
          <p className="text-sm text-slate-600">
            Если потеряете телефон, вход возможен по одному из этих кодов (каждый работает один раз). Они показываются <b>только сейчас</b> — запишите или сфотографируйте.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 font-mono text-sm sm:grid-cols-5">
            {codes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard?.writeText(codes.join("\n"))} className="a-btn-ghost">Скопировать</button>
            <button onClick={relogin} className="a-btn-accent">Я сохранил — войти заново</button>
          </div>
        </section>
      )}

      {/* 2FA */}
      <section className="a-card space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Двухфакторная защита (2FA)</h2>
            <p className="mt-1 text-sm text-slate-500">
              После пароля нужно вводить 6-значный код из приложения на телефоне. Даже если пароль украдут, зайти в админку без вашего телефона не получится.
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${twoFactor ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {twoFactor ? "Включена" : "Выключена"}
          </span>
        </div>

        {!twoFactor && !setup && (
          <button disabled={busy} onClick={() => run({ action: "begin2fa" }, (d) => setSetup(d))} className="a-btn-accent">Включить 2FA</button>
        )}

        {!twoFactor && setup && (
          <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
            <div>
              <img src={setup.qr} alt="QR-код для приложения-аутентификатора" width={240} height={240} className="rounded-xl border border-slate-200" />
            </div>
            <div className="space-y-3 text-sm">
              <ol className="list-decimal space-y-1.5 pl-5 text-slate-600">
                <li>Установите на телефон приложение <b>Google Authenticator</b>, <b>Microsoft Authenticator</b>, <b>Authy</b> или используйте <b>1Password / iCloud Passwords</b>.</li>
                <li>В приложении нажмите «＋» и отсканируйте QR-код слева.</li>
                <li>Введите 6-значный код из приложения ниже.</li>
              </ol>
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold">Не получается сканировать? Ввести ключ вручную</summary>
                <code className="mt-1 block break-all rounded bg-slate-100 p-2 font-mono text-sm text-slate-800">{setup.secret}</code>
              </details>
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={7} className="a-input max-w-[160px] text-center font-mono text-lg tracking-widest" />
                <button
                  disabled={busy || code.replace(/\s/g, "").length !== 6}
                  onClick={() => run({ action: "confirm2fa", code }, (d) => { setCodes(d.codes); setSetup(null); setCode(""); })}
                  className="a-btn-accent"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}

        {twoFactor && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Резервных кодов осталось: <b>{recoveryLeft}</b></p>
            <div className="flex flex-wrap items-center gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Код из приложения" maxLength={7} className="a-input max-w-[200px] text-center font-mono tracking-widest" />
              <button disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={() => run({ action: "recovery", code }, (d) => { setCodes(d.codes); setCode(""); })} className="a-btn-ghost">Выпустить новые резервные коды</button>
              {!required && (
                <button disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={() => run({ action: "disable2fa", code }, () => { setMsg({ ok: true, text: "2FA отключена" }); setCode(""); router.refresh(); })} className="a-btn px-4 text-red-600 hover:bg-red-50">Отключить 2FA</button>
              )}
            </div>
            <p className="text-xs text-slate-400">Для этих действий введите актуальный код из приложения.</p>
          </div>
        )}
      </section>

      {/* Пароль */}
      {!isOwner && (
        <section className="a-card space-y-3 p-5">
          <h2 className="font-semibold">Смена пароля</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="a-label">Текущий пароль</span>
              <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="a-input" />
            </label>
            <label className="block">
              <span className="a-label">Новый пароль (от 10 символов, буквы и цифры)</span>
              <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="a-input" />
            </label>
          </div>
          <button disabled={busy || !pw.current || !pw.next} onClick={() => run({ action: "password", ...pw }, relogin)} className="a-btn-primary">Сменить пароль</button>
        </section>
      )}
      {isOwner && (
        <section className="a-card p-5 text-sm text-slate-600">
          <h2 className="mb-1 font-semibold text-slate-900">Пароль владельца</h2>
          Задаётся на сервере в настройках (<code>ADMIN_PASSWORD</code>). Чтобы сменить — измените его там и перезапустите сайт.
        </section>
      )}

      {/* Сессии */}
      <section className="a-card space-y-3 p-5">
        <h2 className="font-semibold">Выйти на всех устройствах</h2>
        <p className="text-sm text-slate-500">Завершит вашу сессию везде: на телефоне, компьютере и в чужих браузерах. Полезно, если потеряли устройство.</p>
        <button disabled={busy} onClick={() => run({ action: "logout_all" }, relogin)} className="a-btn-ghost">Завершить все сессии</button>
      </section>
    </div>
  );
}
