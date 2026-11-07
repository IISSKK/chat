"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Slot = { kind: "car" | "engine"; title: string; image: string | null; custom: boolean; allowed: boolean };

export function CoversEditor({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const upload = async (kind: string, file: File) => {
    setBusy(kind);
    setMsg(null);
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);
    const r = await fetch("/api/admin/covers", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setMsg({ ok: false, text: d.error || "Не удалось загрузить" });
    setMsg({ ok: true, text: "Обложка обновлена. На главной изменится сразу." });
    router.refresh();
  };

  const reset = async (kind: string) => {
    if (!confirm("Вернуть автоматическую обложку (фото самого свежего объявления)?")) return;
    setBusy(kind);
    const r = await fetch("/api/admin/covers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    setBusy("");
    if (!r.ok) return setMsg({ ok: false, text: "Не удалось сбросить" });
    setMsg({ ok: true, text: "Возвращена автоматическая обложка." });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {msg && <p className={`animate-fade-in rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {slots.map((s) => (
          <section key={s.kind} className="a-card space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{s.title}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.custom ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500"}`}>{s.custom ? "Своя картинка" : "Автоматически"}</span>
            </div>
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
              {s.image ? <img src={s.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-slate-400">Нет картинки</div>}
            </div>
            {s.allowed ? (
              <div className="flex flex-wrap gap-2">
                <input
                  ref={(el) => {
                    inputs.current[s.kind] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) upload(s.kind, f);
                  }}
                />
                <button disabled={busy === s.kind} onClick={() => inputs.current[s.kind]?.click()} className="a-btn-accent">{busy === s.kind ? "Загрузка…" : "Заменить фото"}</button>
                {s.custom && <button disabled={busy === s.kind} onClick={() => reset(s.kind)} className="a-btn-ghost">Вернуть автоматически</button>}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Нет права менять этот раздел.</p>
            )}
          </section>
        ))}
      </div>
      <p className="text-xs text-slate-400">Подойдёт горизонтальное фото, лучше от 1600 px по ширине (JPG, PNG, WebP). Поверх картинки на сайте накладывается синий градиент, чтобы белый текст читался.</p>
    </div>
  );
}
