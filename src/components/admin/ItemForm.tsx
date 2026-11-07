"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ru from "@/i18n/dictionaries/ru";
import { CATEGORIES, FUELS, MAX_PHOTOS, TRANSMISSIONS, type Item, type ItemType } from "@/lib/types";
import { photoUrl } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PlusIcon, TrashIcon } from "@/components/icons";

type PhotoEntry =
  | { key: string; kind: "existing"; filename: string; url: string }
  | { key: string; kind: "new"; file: File; url: string };

const categoryLabels: Record<(typeof CATEGORIES)[number], string> = {
  standby: "Stand by (подготовлен к продаже)",
  listing: "Обычное объявление",
  running: "На ходу",
};

export function ItemForm({
  itemType,
  backHref,
  item,
}: {
  itemType: ItemType;
  backHref: string;
  item?: Item;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoEntry[]>(
    () => item?.photos.map((p) => ({ key: `e${p.id}`, kind: "existing" as const, filename: p.filename, url: photoUrl(p.filename) })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => photos.forEach((p) => p.kind === "new" && URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (list.length > room) setError(`Максимум ${MAX_PHOTOS} фото. Лишние файлы пропущены.`);
      return [
        ...prev,
        ...list.slice(0, Math.max(0, room)).map((file, i) => ({
          key: `n${Date.now()}_${i}`,
          kind: "new" as const,
          file,
          url: URL.createObjectURL(file),
        })),
      ];
    });
  };

  const move = (from: number, to: number) =>
    setPhotos((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });

  const remove = (key: string) =>
    setPhotos((prev) => {
      const p = prev.find((x) => x.key === key);
      if (p?.kind === "new") URL.revokeObjectURL(p.url);
      return prev.filter((x) => x.key !== key);
    });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("type", itemType);
    const order: unknown[] = [];
    let n = 0;
    for (const p of photos) {
      if (p.kind === "existing") order.push({ kind: "existing", filename: p.filename });
      else {
        fd.append("newPhotos", p.file);
        order.push({ kind: "new", index: n++ });
      }
    }
    fd.set("photoOrder", JSON.stringify(order));
    const res = await fetch(item ? `/api/admin/items/${item.id}` : "/api/admin/items", { method: item ? "PUT" : "POST", body: fd });
    if (!res.ok) {
      setSaving(false);
      setError((await res.json().catch(() => ({}))).error || "Не удалось сохранить");
      return;
    }
    router.push(backHref);
    router.refresh();
  };

  const v = item;
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="a-label">{label}</span>
      <input name={name} defaultValue={(v?.[name as keyof Item] as string | number | null | undefined) ?? ""} className="a-input" {...props} />
    </label>
  );

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="a-card space-y-4 p-5">
          <h2 className="font-semibold">Основное</h2>
          {field("title", "Название *", { required: true, placeholder: "Hyundai Sonata DN8 2.0" })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("brand", "Марка", { placeholder: "Hyundai", list: "brands" })}
            {field("model", "Модель", { placeholder: "Sonata" })}
          </div>
          <datalist id="brands">
            {["Hyundai", "Kia", "Genesis", "SsangYong", "Renault Samsung", "Chevrolet"].map((b) => <option key={b} value={b} />)}
          </datalist>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="a-label">Категория</span>
              <select name="category" defaultValue={v?.category ?? "listing"} className="a-select">
                {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="a-label">Статус</span>
              <select name="status" defaultValue={v?.status ?? "available"} className="a-select">
                <option value="available">В наличии</option>
                <option value="sold">Продано (SOLDOUT)</option>
              </select>
            </label>
          </div>
        </section>

        <section className="a-card space-y-4 p-5">
          <h2 className="font-semibold">Характеристики</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("year", "Год выпуска", { type: "number", min: 1950, max: 2100, inputMode: "numeric" })}
            {field("first_registration", "Год / дата первой регистрации", { placeholder: "2021-03" })}
            {field("vin", "VIN", { placeholder: "KMHL341DBLA012345", className: "a-input font-mono uppercase" })}
            {field("serial", "Серийный номер", { className: "a-input font-mono uppercase" })}
            {field("engine_code", "Код двигателя", { placeholder: "G4KE", className: "a-input font-mono uppercase" })}
            {field("displacement", "Объём, см³", { type: "number", min: 0, inputMode: "numeric", placeholder: "1999" })}
            <label className="block">
              <span className="a-label">Коробка</span>
              <select name="transmission" defaultValue={v?.transmission ?? ""} className="a-select">
                <option value="">—</option>
                {TRANSMISSIONS.map((x) => <option key={x} value={x}>{ru.transmission[x]}</option>)}
              </select>
            </label>
            {field("mileage", "Пробег, км", { type: "number", min: 0, inputMode: "numeric" })}
            <label className="block">
              <span className="a-label">Топливо</span>
              <select name="fuel" defaultValue={v?.fuel ?? ""} className="a-select">
                <option value="">—</option>
                {FUELS.map((x) => <option key={x} value={x}>{ru.fuel[x]}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="a-label">Примечания</span>
            <textarea name="notes" rows={5} defaultValue={v?.notes ?? ""} className="a-input resize-y" placeholder="Состояние, комплектация, особенности…" />
          </label>
        </section>
      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className="a-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Фото</h2>
            <span className="text-xs text-slate-400">{photos.length} / {MAX_PHOTOS} · первое — обложка</span>
          </div>
          <div
            onDragOver={(e) => {
              if (!dragKey) {
                e.preventDefault();
                setDropActive(true);
              }
            }}
            onDragLeave={() => setDropActive(false)}
            onDrop={(e) => {
              setDropActive(false);
              if (e.dataTransfer.files.length && !dragKey) {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }
            }}
            className={`grid grid-cols-2 gap-2 rounded-xl p-1 transition min-[420px]:grid-cols-3 ${dropActive ? "bg-ember/10 ring-2 ring-ember" : ""}`}
          >
            {photos.map((p, i) => (
              <div
                key={p.key}
                draggable
                onDragStart={() => setDragKey(p.key)}
                onDragEnd={() => setDragKey(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragKey && dragKey !== p.key) move(photos.findIndex((x) => x.key === dragKey), i);
                }}
                className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg bg-slate-100 ring-ember transition active:cursor-grabbing ${
                  dragKey === p.key ? "opacity-40 ring-2" : ""
                } ${i === 0 ? "ring-2 ring-brand-600" : ""}`}
              >
                <img src={p.url} alt="" className="h-full w-full object-cover" draggable={false} />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand px-1.5 text-[10px] font-bold text-ink">Обложка</span>}
                {p.kind === "new" && <span className="absolute right-1 top-1 rounded bg-ember px-1.5 text-[10px] font-bold text-white">new</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="grid h-10 w-10 place-items-center rounded-md sm:h-7 sm:w-7 bg-white/90 text-slate-800 disabled:opacity-30" aria-label="Левее">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(p.key)} className="grid h-10 w-10 place-items-center rounded-md sm:h-7 sm:w-7 bg-red-600 text-white" aria-label="Удалить фото">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} className="grid h-10 w-10 place-items-center rounded-md sm:h-7 sm:w-7 bg-white/90 text-slate-800 disabled:opacity-30" aria-label="Правее">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-ember hover:text-ember"
              >
                <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                  <PlusIcon className="h-6 w-6" /> Добавить
                </span>
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="mt-3 text-xs text-slate-400">Перетащите файлы сюда или нажмите «Добавить». Порядок меняется перетаскиванием или стрелками. Фото автоматически сжимаются.</p>
        </section>

        {error && <p className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => router.push(backHref)} className="a-btn-ghost flex-1">Отмена</button>
          <button disabled={saving} className="a-btn-accent flex-[2] py-3">
            {saving ? "Сохраняем…" : item ? "Сохранить изменения" : "Опубликовать"}
          </button>
        </div>
      </div>
    </form>
  );
}
