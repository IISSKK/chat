"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null); // второй шаг: код 2FA

  const done = () => {
    const next = params.get("next");
    router.replace(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
    router.refresh();
  };

  const post = async (url: string, body: unknown) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!ticket) {
      const { ok, data } = await post("/api/admin/login", { user: fd.get("user"), password: fd.get("password") });
      if (!ok) return setError(data.error || "Ошибка входа");
      if (data.need2fa) return setTicket(data.ticket);
      return done();
    }
    const { ok, data } = await post("/api/admin/login/2fa", { ticket, code: fd.get("code") });
    if (!ok) {
      if (data.expired) {
        setTicket(null);
      }
      return setError(data.error || "Неверный код");
    }
    done();
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm animate-fade-up rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-ember font-display text-lg font-extrabold text-white">B</span>
        <div>
          <h1 className="font-display text-lg font-bold">{ticket ? "Код подтверждения" : "Вход в админку"}</h1>
          <p className="text-xs text-slate-500">{ticket ? "Откройте приложение-аутентификатор" : "Только для владельца сайта"}</p>
        </div>
      </div>

      {!ticket ? (
        <>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Логин</span>
            <input name="user" autoComplete="username" required className="a-input" autoFocus autoCapitalize="none" />
          </label>
          <label className="mb-6 block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Пароль</span>
            <input name="password" type="password" autoComplete="current-password" required className="a-input" />
          </label>
        </>
      ) : (
        <label className="mb-6 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">6-значный код (или резервный код)</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            className="a-input text-center font-mono text-xl tracking-[0.3em]"
            placeholder="000000"
            maxLength={16}
          />
        </label>
      )}

      {error && <p className="mb-4 animate-fade-in rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="a-btn-primary w-full py-3">
        {loading ? "Проверяем…" : ticket ? "Подтвердить" : "Войти"}
      </button>
      {ticket && (
        <button type="button" onClick={() => { setTicket(null); setError(""); }} className="mt-3 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800">
          ← Назад
        </button>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4 text-slate-900 [color-scheme:light]">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
