"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditIcon, EyeIcon, RestoreIcon, TrashIcon } from "@/components/icons";
import { ConfirmDialog } from "./ConfirmDialog";

type Status = "available" | "sold" | "draft";

export function RowActions({
  id,
  status: initial,
  editHref,
  viewHref,
  title,
  canDelete = false,
  variant = "row",
  trash = false,
}: {
  id: number;
  status: Status;
  editHref: string;
  viewHref: string;
  title: string;
  /** право «Удаление навсегда» */
  canDelete?: boolean;
  /** "row" — ячейки таблицы (компьютер), "card" — карточка (телефон) */
  variant?: "row" | "card";
  /** строка из корзины */
  trash?: boolean;
}) {
  const router = useRouter();
  const card = variant === "card";
  const [status, setStatus] = useState<Status>(initial);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "trash" | "purge">(null);
  const [error, setError] = useState("");

  const call = async (url: string, init: RequestInit) => {
    setBusy(true);
    setError("");
    const res = await fetch(url, init);
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Ошибка");
      return false;
    }
    router.refresh();
    return true;
  };

  const setTo = async (next: Status) => {
    const prev = status;
    setStatus(next);
    const ok = await call(`/api/admin/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (!ok) setStatus(prev);
  };

  const h = card ? "min-h-11" : "";
  const btn = card ? "min-h-11 px-4 text-sm" : "px-3 py-2 text-xs";

  const statusControl = trash ? (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">В корзине</span>
  ) : status === "draft" ? (
    <span className="inline-flex items-center gap-2">
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Черновик</span>
      <button disabled={busy} onClick={() => setTo("available")} className={`a-btn-ghost ${btn}`} title="Показать на сайте">Опубликовать</button>
    </span>
  ) : (
    <button
      onClick={() => setTo(status === "sold" ? "available" : "sold")}
      disabled={busy}
      title="Быстрая смена статуса"
      className={`group inline-flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-3 text-xs font-semibold transition ${h} ${
        status === "sold" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${status === "sold" ? "bg-red-500" : "bg-emerald-500"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${status === "sold" ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {status === "sold" ? "Продано" : "В наличии"}
    </button>
  );

  const actions = trash ? (
    <div className={`flex items-center gap-1 ${card ? "flex-1 justify-end" : "justify-end"}`}>
      <button disabled={busy} onClick={() => call(`/api/admin/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore" }) })} className={`a-btn-ghost ${btn}`}>
        <RestoreIcon className="h-4 w-4" /> Восстановить
      </button>
      {canDelete && (
        <button onClick={() => setConfirm("purge")} className={`a-btn text-red-600 hover:bg-red-50 ${btn}`} aria-label="Удалить навсегда">
          <TrashIcon className="h-4 w-4" /> <span className={card ? "sr-only" : ""}>Навсегда</span>
        </button>
      )}
    </div>
  ) : (
    <div className={`flex items-center gap-1 ${card ? "flex-1 justify-end" : "justify-end"}`}>
      <a href={viewHref} target="_blank" className={`grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${card ? "h-11 w-11" : "h-9 w-9"}`} title="Открыть на сайте" aria-label="Открыть на сайте">
        <EyeIcon className="h-4 w-4" />
      </a>
      <Link href={editHref} className={`a-btn-ghost ${btn}`}>
        <EditIcon className="h-4 w-4" /> Изменить
      </Link>
      <button onClick={() => setConfirm("trash")} className={`a-btn text-red-600 hover:bg-red-50 ${btn}`} aria-label="В корзину">
        <TrashIcon className="h-4 w-4" /> <span className={card ? "sr-only" : ""}>В корзину</span>
      </button>
    </div>
  );

  const dialog = (
    <ConfirmDialog
      open={!!confirm}
      title={confirm === "purge" ? "Удалить навсегда?" : "Переместить в корзину?"}
      text={
        confirm === "purge"
          ? `«${title}» и все его фото будут удалены без возможности восстановления.`
          : `«${title}» исчезнет с сайта. 30 дней его можно вернуть из корзины.`
      }
      confirmLabel={confirm === "purge" ? "Удалить навсегда" : "В корзину"}
      busy={busy}
      onCancel={() => setConfirm(null)}
      onConfirm={async () => {
        const ok = await call(`/api/admin/items/${id}${confirm === "purge" ? "?permanent=1" : ""}`, { method: "DELETE" });
        if (ok) setConfirm(null);
      }}
    />
  );

  const err = error ? <p className="text-xs text-red-600">{error}</p> : null;

  if (card) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          {statusControl}
          {actions}
        </div>
        {err}
        {dialog}
      </div>
    );
  }
  return (
    <>
      <td className="px-4 py-3">{statusControl}{err}</td>
      <td className="px-4 py-3">
        {actions}
        {dialog}
      </td>
    </>
  );
}
