"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { PlusIcon, TrashIcon } from "@/components/icons";

type Perm = { id: string; label: string; hint: string };
type Admin = { id: number; username: string; permissions: string[]; active: boolean; created_at: string; last_login: string | null };

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

function PermChecklist({ perms, value, onChange }: { perms: Perm[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {perms.map((p) => {
        const on = value.includes(p.id);
        return (
          <label
            key={p.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${on ? "border-brand/40 bg-brand/5" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => onChange(on ? value.filter((x) => x !== p.id) : [...value, p.id])}
              className="mt-0.5 h-4 w-4 accent-[#007AFF]"
            />
            <span>
              <span className="block text-sm font-semibold">{p.label}</span>
              <span className="block text-xs text-slate-500">{p.hint}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function AdminsManager({ initial, owner, meId, permissions }: { initial: Admin[]; owner: string; meId: number; permissions: Perm[] }) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", permissions: ["cars", "engines"] as string[] });
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ permissions: string[]; password: string }>({ permissions: [], password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Admin | null>(null);

  const reload = async () => {
    const d = await api("/api/admin/admins", "GET");
    setAdmins(d.admins);
    router.refresh();
  };

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await reload();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const label = (id: string) => permissions.find((p) => p.id === id)?.label ?? id;

  return (
    <div className="space-y-4">
      {error && <p className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="a-card divide-y divide-slate-100">
        {/* Владелец */}
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-ember font-bold text-white">{owner[0]?.toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {owner} <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Владелец</span>
            </p>
            <p className="text-xs text-slate-500">Все права. Логин и пароль задаются в настройках сервера (ADMIN_USER / ADMIN_PASSWORD).</p>
          </div>
        </div>

        {admins.map((a) => (
          <div key={a.id} className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-full font-bold ${a.active ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-400"}`}>
                {a.username[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {a.username}
                  {a.id === meId && <span className="ml-2 text-xs font-normal text-slate-400">(это вы)</span>}
                  {!a.active && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">Отключён</span>}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {a.permissions.length ? (
                    a.permissions.map((p) => (
                      <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{label(p)}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">нет доступа ни к одному разделу</span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Последний вход: {a.last_login ? a.last_login.slice(0, 16) : "ещё не входил"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setEditing(editing === a.id ? null : a.id);
                    setDraft({ permissions: a.permissions, password: "" });
                  }}
                  className="a-btn-ghost px-3 py-2 text-xs"
                >
                  {editing === a.id ? "Свернуть" : "Права и пароль"}
                </button>
                {a.id !== meId && (
                  <>
                    <button onClick={() => run(() => api(`/api/admin/admins/${a.id}`, "PUT", { active: !a.active }))} disabled={busy} className="a-btn-ghost px-3 py-2 text-xs">
                      {a.active ? "Отключить" : "Включить"}
                    </button>
                    <button onClick={() => setToDelete(a)} className="a-btn px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing === a.id && (
              <div className="mt-4 animate-fade-up space-y-3 rounded-2xl bg-slate-50 p-4">
                <PermChecklist perms={permissions} value={draft.permissions} onChange={(v) => setDraft((d) => ({ ...d, permissions: v }))} />
                <label className="block">
                  <span className="a-label">Новый пароль (необязательно)</span>
                  <input type="password" autoComplete="new-password" value={draft.password} onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))} className="a-input max-w-sm" placeholder="минимум 8 символов" />
                </label>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={async () => {
                      const ok = await run(() => api(`/api/admin/admins/${a.id}`, "PUT", { permissions: draft.permissions, password: draft.password || undefined }));
                      if (ok) setEditing(null);
                    }}
                    className="a-btn-accent"
                  >
                    Сохранить
                  </button>
                  <button onClick={() => setEditing(null)} className="a-btn-ghost">Отмена</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!creating ? (
        <button onClick={() => setCreating(true)} className="a-btn-accent">
          <PlusIcon className="h-4 w-4" /> Добавить администратора
        </button>
      ) : (
        <form
          className="a-card animate-fade-up space-y-4 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run(() => api("/api/admin/admins", "POST", form));
            if (ok) {
              setCreating(false);
              setForm({ username: "", password: "", permissions: ["cars", "engines"] });
            }
          }}
        >
          <h2 className="font-semibold">Новый администратор</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="a-label">Логин</span>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="a-input" placeholder="manager1" autoComplete="off" />
            </label>
            <label className="block">
              <span className="a-label">Пароль</span>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="a-input" placeholder="минимум 8 символов" autoComplete="new-password" />
            </label>
          </div>
          <div>
            <span className="a-label">Доступ к разделам</span>
            <PermChecklist perms={permissions} value={form.permissions} onChange={(v) => setForm({ ...form, permissions: v })} />
          </div>
          <div className="flex gap-2">
            <button disabled={busy} className="a-btn-accent">{busy ? "Создаём…" : "Создать"}</button>
            <button type="button" onClick={() => setCreating(false)} className="a-btn-ghost">Отмена</button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Удалить администратора?"
        text={`«${toDelete?.username}» больше не сможет войти в админку.`}
        confirmLabel="Удалить"
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await run(() => api(`/api/admin/admins/${toDelete.id}`, "DELETE"));
          setToDelete(null);
        }}
      />
    </div>
  );
}
