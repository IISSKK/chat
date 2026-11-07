"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ConfirmDialog } from "./ConfirmDialog";

type Model = { id: number; name: string; used: number };
type Brand = { id: number; name: string; slug: string; used: number; models: Model[] };

async function call(body: unknown) {
  const res = await fetch("/api/admin/catalog-refs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export function BrandsManager({ initial }: { initial: Brand[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [del, setDel] = useState<{ kind: "Brand" | "Model"; id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const act = async (body: object) => {
    setBusy(true);
    setError("");
    const { ok, data } = await call(body);
    setBusy(false);
    if (!ok) {
      setError(data.error || "Ошибка");
      return false;
    }
    router.refresh();
    return true;
  };

  const rename = async (kind: "Brand" | "Model", id: number, current: string) => {
    const name = prompt(`Новое название (${kind === "Brand" ? "марка" : "модель"}):`, current);
    if (name && name.trim() && name.trim() !== current) await act({ action: `rename${kind}`, id, name });
  };

  return (
    <div className="space-y-4">
      {error && <p className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <form
        className="a-card flex gap-2 p-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act({ action: "addBrand", name: newBrand })) setNewBrand("");
        }}
      >
        <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Новая марка, например Hyundai" className="a-input" maxLength={60} />
        <button disabled={busy || !newBrand.trim()} className="a-btn-accent shrink-0"><PlusIcon className="h-4 w-4" /> Добавить марку</button>
      </form>

      <div className="a-card divide-y divide-slate-100">
        {initial.map((b) => (
          <div key={b.id}>
            <div className="flex items-center gap-2 px-4 py-3">
              <button onClick={() => setOpen(open === b.id ? null : b.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open === b.id}>
                <span className={`text-slate-400 transition-transform ${open === b.id ? "rotate-90" : ""}`}>›</span>
                <span className="truncate font-semibold">{b.name}</span>
                <span className="text-xs text-slate-400">{b.models.length} мод. · {b.used} объявл.</span>
              </button>
              <button onClick={() => rename("Brand", b.id, b.name)} className="a-btn-ghost px-3 py-2" aria-label="Переименовать"><EditIcon className="h-4 w-4" /></button>
              <button onClick={() => setDel({ kind: "Brand", id: b.id, name: b.name })} disabled={b.used > 0} title={b.used > 0 ? "Используется в объявлениях" : "Удалить"} className="a-btn px-3 py-2 text-red-600 hover:bg-red-50" aria-label="Удалить"><TrashIcon className="h-4 w-4" /></button>
            </div>
            {open === b.id && (
              <div className="animate-fade-up space-y-2 bg-slate-50/70 px-4 pb-4 pt-1">
                <div className="flex flex-wrap gap-2">
                  {b.models.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-3 pr-1 text-sm ring-1 ring-slate-200">
                      {m.name} <span className="text-xs text-slate-400">{m.used}</span>
                      <button onClick={() => rename("Model", m.id, m.name)} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Переименовать"><EditIcon className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDel({ kind: "Model", id: m.id, name: m.name })} disabled={m.used > 0} title={m.used > 0 ? "Используется в объявлениях" : "Удалить"} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label="Удалить"><TrashIcon className="h-3.5 w-3.5" /></button>
                    </span>
                  ))}
                  {!b.models.length && <span className="text-sm text-slate-400">Моделей пока нет</span>}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await act({ action: "addModel", brandId: b.id, name: newModel[b.id] ?? "" })) setNewModel({ ...newModel, [b.id]: "" });
                  }}
                >
                  <input value={newModel[b.id] ?? ""} onChange={(e) => setNewModel({ ...newModel, [b.id]: e.target.value })} placeholder={`Новая модель ${b.name}`} className="a-input max-w-xs" maxLength={60} />
                  <button disabled={busy || !(newModel[b.id] ?? "").trim()} className="a-btn-ghost">Добавить модель</button>
                </form>
              </div>
            )}
          </div>
        ))}
        {!initial.length && <p className="px-4 py-12 text-center text-slate-400">Справочник пуст — добавьте первую марку</p>}
      </div>

      <ConfirmDialog
        open={!!del}
        title={`Удалить ${del?.kind === "Brand" ? "марку" : "модель"}?`}
        text={`«${del?.name}» исчезнет из справочника. Это возможно, только если она не используется в объявлениях.`}
        confirmLabel="Удалить"
        busy={busy}
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          if (del) await act({ action: `delete${del.kind}`, id: del.id, name: del.name });
          setDel(null);
        }}
      />
    </div>
  );
}
