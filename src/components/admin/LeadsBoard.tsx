"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrashIcon, WhatsAppIcon, MailIcon } from "@/components/icons";
import { ConfirmDialog } from "./ConfirmDialog";

type Lead = { id: number; created_at: string; name: string; contact: string; country: string; message: string; item_id: number | null; item_title: string; lang: string; source: string; status: string; note: string };

const STATUS: { id: string; label: string; cls: string }[] = [
  { id: "new", label: "Новая", cls: "bg-brand/10 text-brand" },
  { id: "in_progress", label: "В работе", cls: "bg-amber-100 text-amber-700" },
  { id: "deal", label: "Сделка", cls: "bg-emerald-100 text-emerald-700" },
  { id: "closed", label: "Закрыта", cls: "bg-slate-100 text-slate-500" },
];

/** Ссылка для связи: WhatsApp для телефона, mailto для почты, Telegram для @ника */
function contactLink(c: string) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return { href: `mailto:${c}`, icon: <MailIcon className="h-4 w-4" />, label: "Написать" };
  if (/^@/.test(c)) return { href: `https://t.me/${c.slice(1)}`, icon: null, label: "Telegram" };
  return { href: `https://wa.me/${c.replace(/\D/g, "")}`, icon: <WhatsAppIcon className="h-4 w-4" />, label: "WhatsApp" };
}

export function LeadsBoard({ leads, canDelete }: { leads: Lead[]; canDelete: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState<Record<number, string>>({});
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = async (id: number, body: object) => {
    await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  };

  if (!leads.length) return <div className="a-card px-4 py-16 text-center text-slate-400">Заявок пока нет</div>;

  return (
    <div className="space-y-3">
      {leads.map((l) => {
        const link = contactLink(l.contact);
        const st = STATUS.find((s) => s.id === l.status) ?? STATUS[0];
        return (
          <div key={l.id} className={`a-card space-y-3 p-4 ${l.status === "new" ? "border-brand/40 shadow-[0_0_0_3px_rgb(var(--c-brand)/0.08)]" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {l.name} <span className="font-normal text-slate-400">· #{l.id}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {l.created_at.slice(0, 16)} · {l.country || "страна не указана"}
                  {l.lang && ` · ${l.lang.toUpperCase()}`}
                  {l.source && ` · ${l.source}`}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <a href={link.href} target="_blank" rel="noopener" className="a-btn-ghost px-3 py-2 text-xs">
                {link.icon} {l.contact}
              </a>
              {l.item_id && (
                <a href={`/item/${l.item_id}`} target="_blank" className="text-xs font-semibold text-brand hover:underline">
                  {l.item_title || `Объявление #${l.item_id}`} ↗
                </a>
              )}
            </div>
            {l.message && <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{l.message}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <select value={l.status} onChange={(e) => patch(l.id, { status: e.target.value })} className="a-select max-w-[170px] py-2 text-sm">
                {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <input
                value={note[l.id] ?? l.note}
                onChange={(e) => setNote({ ...note, [l.id]: e.target.value })}
                onBlur={() => note[l.id] !== undefined && note[l.id] !== l.note && patch(l.id, { note: note[l.id] })}
                placeholder="Заметка (сохраняется сама)"
                className="a-input min-w-[160px] flex-1 py-2 text-sm"
                maxLength={2000}
              />
              {canDelete && (
                <button onClick={() => setToDelete(l)} className="a-btn px-3 py-2 text-red-600 hover:bg-red-50" aria-label="Удалить заявку">
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      <ConfirmDialog
        open={!!toDelete}
        title="Удалить заявку?"
        text={`Заявка от «${toDelete?.name}» будет удалена навсегда.`}
        confirmLabel="Удалить"
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          setBusy(true);
          await fetch(`/api/admin/leads/${toDelete.id}`, { method: "DELETE" });
          setBusy(false);
          setToDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}
