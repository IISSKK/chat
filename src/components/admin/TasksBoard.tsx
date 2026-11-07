"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/Select";

type Task = { id: number; ts: string; author: string; text: string; status: string; reply: string };
const STATUS = [
  { id: "new", label: "Новая", cls: "bg-blue-100 text-blue-700" },
  { id: "in_progress", label: "В работе", cls: "bg-amber-100 text-amber-700" },
  { id: "done", label: "Готово", cls: "bg-emerald-100 text-emerald-700" },
];
const MAX = 600;

export function TasksBoard({ tasks, isOwner }: { tasks: Task[]; isOwner: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reply, setReply] = useState<Record<number, string>>({});

  const call = async (url: string, method: string, body?: unknown) => {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Ошибка");
  };

  const send = async () => {
    setBusy(true);
    setErr("");
    try {
      await call("/api/admin/tasks", "POST", { text });
      setText("");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };
  const patch = async (id: number, b: object) => {
    try {
      await call(`/api/admin/tasks/${id}`, "PATCH", b);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <section className="a-card space-y-3 p-5">
        <label className="a-label" htmlFor="task-text">Что нужно сделать на сайте</label>
        <textarea
          id="task-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={3}
          className="a-input resize-y"
          placeholder="Коротко, например: «добавить раздел Запчасти» или «изменить цвет кнопки»"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">{text.length}/{MAX}</span>
          <button disabled={busy || text.trim().length < 3} onClick={send} className="a-btn-accent">Отправить задачу</button>
        </div>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
      </section>

      <div className="space-y-3">
        {tasks.length === 0 && <p className="a-card p-5 text-sm text-slate-500">Задач пока нет.</p>}
        {tasks.map((t) => {
          const st = STATUS.find((s) => s.id === t.status) ?? STATUS[0];
          return (
            <article key={t.id} className="a-card space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={`rounded-full px-2.5 py-0.5 font-bold ${st.cls}`}>{st.label}</span>
                <span>#{t.id}</span>
                <span>{t.author}</span>
                <span>{t.ts.slice(0, 16).replace("T", " ")}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{t.text}</p>
              {t.reply && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"><b>Ответ:</b> {t.reply}</p>}
              {isOwner && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Select variant="admin" className="w-[160px]" value={t.status} onChange={(v) => patch(t.id, { status: v })} aria-label="Статус задачи" options={STATUS.map((s) => ({ value: s.id, label: s.label }))} />
                  <input
                    value={reply[t.id] ?? t.reply}
                    onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })}
                    onBlur={() => reply[t.id] !== undefined && reply[t.id] !== t.reply && patch(t.id, { reply: reply[t.id] })}
                    placeholder="Ответ (сохраняется сам)"
                    className="a-input min-w-[160px] flex-1 py-2 text-sm"
                  />
                  <button
                    onClick={async () => {
                      if (!confirm("Удалить задачу?")) return;
                      await call(`/api/admin/tasks/${t.id}`, "DELETE").catch(() => {});
                      router.refresh();
                    }}
                    className="a-btn-ghost py-2 text-sm text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
