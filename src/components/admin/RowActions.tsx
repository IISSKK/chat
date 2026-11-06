"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditIcon, EyeIcon, TrashIcon } from "@/components/icons";
import { ConfirmDialog } from "./ConfirmDialog";

export function RowActions({
  id,
  status: initial,
  editHref,
  viewHref,
  title,
  canDelete = true,
}: {
  id: number;
  status: "available" | "sold";
  editHref: string;
  viewHref: string;
  title: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const toggle = async () => {
    const next = status === "sold" ? "available" : "sold";
    setStatus(next);
    setBusy(true);
    const res = await fetch(`/api/admin/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) setStatus(status);
    router.refresh();
  };

  const remove = async () => {
    setBusy(true);
    await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
    setConfirm(false);
    setBusy(false);
    router.refresh();
  };

  return (
    <>
    <td className="px-4 py-3">
      <button
        onClick={toggle}
        disabled={busy}
        title="Быстрая смена статуса"
        className={`group inline-flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-3 text-xs font-semibold transition ${
          status === "sold" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        <span className={`relative h-5 w-9 rounded-full transition-colors ${status === "sold" ? "bg-red-500" : "bg-emerald-500"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${status === "sold" ? "left-[18px]" : "left-0.5"}`} />
        </span>
        {status === "sold" ? "Продано" : "В наличии"}
      </button>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center justify-end gap-1">
        <a href={viewHref} target="_blank" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" title="Открыть на сайте">
          <EyeIcon className="h-4 w-4" />
        </a>
        <Link href={editHref} className="a-btn-ghost px-3 py-2 text-xs">
          <EditIcon className="h-4 w-4" /> Изменить
        </Link>
        {canDelete && (
          <button onClick={() => setConfirm(true)} className="a-btn px-3 py-2 text-xs text-red-600 hover:bg-red-50">
            <TrashIcon className="h-4 w-4" /> Удалить
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        title="Удалить товар?"
        text={`«${title}» и все его фото будут удалены без возможности восстановления.`}
        confirmLabel="Удалить"
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={remove}
      />
    </td>
    </>
  );
}
