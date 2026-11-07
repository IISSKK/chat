"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Block = { key: string; kind: "user" | "ip"; target: string; scope: "login" | "2fa"; adminName: string | null; secondsLeft: number; times: number };

const left = (s: number) => (s >= 60 ? `${Math.ceil(s / 60)} мин` : `${s} сек`);

export function BlocksList({ initial }: { initial: Block[] }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initial);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const reload = async () => {
    const r = await fetch("/api/admin/blocks", { cache: "no-store" });
    if (r.ok) setBlocks((await r.json()).blocks);
  };
  // список обновляется сам, чтобы время «осталось» и новые блокировки были актуальны
  useEffect(() => {
    const t = setInterval(reload, 10_000);
    return () => clearInterval(t);
  }, []);

  const unlock = async (body: object, id: string) => {
    setBusy(id);
    setErr("");
    const r = await fetch("/api/admin/blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) setErr((await r.json().catch(() => ({}))).error || "Ошибка");
    await reload();
    router.refresh();
    setBusy("");
  };

  return (
    <div className="space-y-4">
      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</p>}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Сейчас заблокировано: <b>{blocks.length}</b></p>
        <div className="flex gap-2">
          <button onClick={reload} className="a-btn-ghost py-2 text-sm">Обновить</button>
          {blocks.length > 1 && (
            <button disabled={busy === "all"} onClick={() => confirm("Снять все блокировки?") && unlock({ all: true }, "all")} className="a-btn-primary py-2 text-sm">Разблокировать всех</button>
          )}
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className="a-card p-5 text-sm text-slate-500">Сейчас никто не заблокирован.</p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li key={b.key} className="a-card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {b.kind === "ip" ? (
                    <>IP <span className="font-mono">{b.target}</span></>
                  ) : b.adminName ? (
                    <>Админ <span className="text-brand">{b.adminName}</span></>
                  ) : (
                    <>Логин «{b.target}»</>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {b.scope === "2fa" ? "неверные коды 2FA" : "неверный пароль"} · осталось {left(b.secondsLeft)}
                  {b.times > 1 ? ` · блокировка №${b.times}` : ""}
                  {b.kind === "user" && !b.adminName ? " · такого администратора нет (подбор логина)" : ""}
                </p>
              </div>
              <button disabled={busy === b.key} onClick={() => unlock({ key: b.key }, b.key)} className="a-btn-accent py-2 text-sm">Разблокировать</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
