"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, PlusIcon, TrashIcon, WhatsAppIcon } from "@/components/icons";

type Contact = { name: string; phone: string; langs: string };

const digits = (p: string) => p.replace(/\D/g, "");

export function ContactsEditor({ initial, max }: { initial: Contact[]; max: number }) {
  const router = useRouter();
  const [list, setList] = useState<Contact[]>(initial.map(({ name, phone, langs }) => ({ name, phone, langs })));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (i: number, patch: Partial<Contact>) => setList((l) => l.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, d: -1 | 1) =>
    setList((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings/whatsapp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: list }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Не удалось сохранить" });
    setList(data.contacts.map(({ name, phone, langs }: Contact) => ({ name, phone, langs })));
    setMsg({ ok: true, text: "Сохранено. Номера уже обновились на сайте." });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {list.map((c, i) => {
          const d = digits(c.phone);
          const valid = d.length >= 8 && d.length <= 15;
          return (
            <div key={i} className="a-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#25D366] text-white">
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">
                  Номер {i + 1}
                  {i === 0 && <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">Основной</span>}
                </span>
                <div className="ml-auto flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="a-btn-ghost px-2 py-1.5" aria-label="Выше">
                    <ChevronLeft className="h-4 w-4 rotate-90" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="a-btn-ghost px-2 py-1.5" aria-label="Ниже">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </button>
                  <button
                    onClick={() => setList((l) => l.filter((_, j) => j !== i))}
                    disabled={list.length === 1}
                    className="a-btn px-2 py-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Удалить номер"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_0.7fr]">
                <label className="block">
                  <span className="a-label">Номер WhatsApp (с кодом страны)</span>
                  <input
                    value={c.phone}
                    onChange={(e) => update(i, { phone: e.target.value })}
                    placeholder="+82 10 1234 5678"
                    inputMode="tel"
                    className={`a-input ${c.phone && !valid ? "border-red-400 focus:border-red-500" : ""}`}
                  />
                  {c.phone && valid && (
                    <a href={`https://wa.me/${d}`} target="_blank" rel="noopener" className="mt-1 inline-block text-xs font-semibold text-brand hover:underline">
                      Проверить: открыть чат wa.me/{d} ↗
                    </a>
                  )}
                </label>
                <label className="block">
                  <span className="a-label">Подпись для посетителей</span>
                  <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Отдел продаж" className="a-input" maxLength={60} />
                </label>
                <label className="block">
                  <span className="a-label">Языки (необяз.)</span>
                  <input value={c.langs} onChange={(e) => update(i, { langs: e.target.value })} placeholder="RU, EN" className="a-input" maxLength={30} />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {list.length < max && (
        <button onClick={() => setList((l) => [...l, { name: "", phone: "", langs: "" }])} className="a-btn-ghost">
          <PlusIcon className="h-4 w-4" /> Добавить номер
        </button>
      )}

      {msg && <p className={`animate-fade-in rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}

      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="a-btn-accent">{busy ? "Сохраняем…" : "Сохранить"}</button>
        <button onClick={() => { setList(initial); setMsg(null); }} className="a-btn-ghost">Отменить изменения</button>
      </div>
    </div>
  );
}
