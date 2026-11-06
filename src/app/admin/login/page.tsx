"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: fd.get("user"), password: fd.get("password") }),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Ошибка входа");
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm animate-fade-up rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-ember font-display text-lg font-extrabold text-white">B</span>
        <div>
          <h1 className="font-display text-lg font-bold">Вход в админку</h1>
          <p className="text-xs text-slate-500">Только для владельца сайта</p>
        </div>
      </div>
      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Логин</span>
        <input name="user" autoComplete="username" required className="a-input" autoFocus />
      </label>
      <label className="mb-6 block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Пароль</span>
        <input name="password" type="password" autoComplete="current-password" required className="a-input" />
      </label>
      {error && <p className="mb-4 animate-fade-in rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="a-btn-primary w-full py-3">
        {loading ? "Проверяем…" : "Войти"}
      </button>
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
