"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ru from "@/i18n/dictionaries/ru";
import { CATEGORIES, FUELS, MAX_PHOTOS, TRANSMISSIONS, type Item, type ItemType } from "@/lib/types";
import { photoUrl } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PlusIcon, TrashIcon } from "@/components/icons";

type RefModel = { id: number; name: string };
type RefBrand = { id: number; name: string; models: RefModel[] };
export type TranslationInfo = {
  enabled: boolean;
  status: string;
  error: string;
  stale: boolean;
  translations: Record<string, { title: string; notes: string }>;
};
const LANG_NAMES: Record<string, string> = { ru: "Русский", en: "English", ko: "한국어", zh: "中文" };

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
  brands: initialBrands,
  translation,
}: {
  itemType: ItemType;
  backHref: string;
  item?: Item;
  brands: RefBrand[];
  translation?: TranslationInfo;
}) {
  const router = useRouter();
  const [brands, setBrands] = useState(initialBrands);
  const [brand, setBrand] = useState(item?.brand ?? "");
  const [model, setModel] = useState(item?.model ?? "");
  const [status, setStatus] = useState<string>(item?.status ?? "draft");
  const intent = useRef<"draft" | "publish" | "save">("save");
  const [trBusy, setTrBusy] = useState(false);
  const [trMsg, setTrMsg] = useState("");
  const brandObj = brands.find((b) => b.name.toLowerCase() === brand.toLowerCase());

  /** Добавление марки/модели «на месте» — с подтверждением, чтобы не создать лишнего случайно */
  const addRef = async (kind: "brand" | "model") => {
    const label = kind === "brand" ? "марки" : `модели (${brand})`;
    const raw = prompt(`Название новой ${label}:`);
    if (!raw || !raw.trim()) return;
    if (!confirm(`Добавить «${raw.trim()}» в справочник?`)) return;
    const res = await fetch("/api/admin/catalog-refs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "brand" ? { action: "addBrand", name: raw } : { action: "addModel", brandId: brandObj?.id, name: raw }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || "Не удалось добавить");
    setError("");
    setBrands(data.brands);
    if (kind === "brand" && data.brand) {
      setBrand(data.brand.name);
      setModel("");
    } else if (data.model) setModel(data.model.name);
  };

  const retranslate = async () => {
    if (!item) return;
    setTrBusy(true);
    setTrMsg("");
    const res = await fetch("/api/admin/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
    const data = await res.json().catch(() => ({}));
    setTrBusy(false);
    setTrMsg(res.ok ? "Перевод запущен — обновите страницу через 10–20 секунд." : data.error || "Ошибка");
  };
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
    fd.set("brand", brand);
    fd.set("model", model);
    // Кнопки «Сохранить черновик» / «Опубликовать» задают статус явно — случайно опубликовать нельзя
    if (intent.current === "draft") fd.set("status", "draft");
    else if (intent.current === "publish") fd.set("status", status === "sold" ? "sold" : "available");
    else fd.set("status", status);
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
            <div>
              <span className="a-label">Марка</span>
              <div className="flex gap-2">
                <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); }} className="a-select">
                  <option value="">— не выбрана —</option>
                  {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <button type="button" onClick={() => addRef("brand")} className="a-btn-ghost shrink-0 px-3" title="Добавить марку в справочник" aria-label="Добавить марку"><PlusIcon className="h-4 w-4" /></button>
              </div>
            </div>
            <div>
              <span className="a-label">{itemType === "engine" ? "Подходит для моделей" : "Модель"}</span>
              {itemType === "engine" ? (
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Sonata / Santa Fe" className="a-input" maxLength={80} />
              ) : (
                <div className="flex gap-2">
                  <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brandObj} className="a-select">
                    <option value="">{brandObj ? "— не выбрана —" : "Сначала выберите марку"}</option>
                    {brandObj?.models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                  <button type="button" onClick={() => addRef("model")} disabled={!brandObj} className="a-btn-ghost shrink-0 px-3" title="Добавить модель в справочник" aria-label="Добавить модель"><PlusIcon className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="a-label">Категория</span>
              <select name="category" defaultValue={v?.category ?? "listing"} className="a-select">
                {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="a-label">Статус</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="a-select">
                <option value="draft">Черновик (не виден на сайте)</option>
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
          <label className="block">
            <span className="a-label">Видео (ссылка на YouTube или Vimeo) — необязательно</span>
            <input name="video_url" defaultValue={v?.video_url ?? ""} className="a-input" placeholder="https://www.youtube.com/watch?v=…" inputMode="url" maxLength={300} />
            <span className="mt-1 block text-xs text-slate-400">Видео показывается на странице объявления. Если поле пустое — блока с видео не будет.</span>
          </label>
        </section>

        {item && translation && (
          <section className="a-card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Автоперевод</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                !translation.enabled ? "bg-slate-100 text-slate-500" : translation.status === "ok" && !translation.stale ? "bg-emerald-100 text-emerald-700" : translation.status === "error" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
              }`}>
                {!translation.enabled ? "Выключен" : translation.status === "ok" && !translation.stale ? "Готово" : translation.status === "error" ? "Ошибка" : "Переводится…"}
              </span>
            </div>
            {!translation.enabled && <p className="text-sm text-slate-500">Чтобы названия и описания переводились на английский, корейский и китайский автоматически, добавьте на сервере ключ <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code>.</p>}
            {translation.status === "error" && <p className="text-xs text-red-600">{translation.error}</p>}
            {Object.entries(translation.translations).map(([l, tr]) => (
              <div key={l} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{LANG_NAMES[l] ?? l}</p>
                <p className="font-semibold">{tr.title}</p>
                {tr.notes && <p className="mt-1 whitespace-pre-line text-slate-600">{tr.notes}</p>}
              </div>
            ))}
            {translation.enabled && (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={retranslate} disabled={trBusy} className="a-btn-ghost">Перевести заново</button>
                {trMsg && <span className="text-xs text-slate-500">{trMsg}</span>}
              </div>
            )}
            <p className="text-xs text-slate-400">Переводится автоматически при каждом сохранении, если изменились название или примечания. Язык оригинала определяется сам.</p>
          </section>
        )}
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

        {(!item || item.status === "draft") && status === "draft" && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">Это черновик: на сайте и в поиске его не видно. Нажмите «Опубликовать», когда всё готово.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => router.push(backHref)} className="a-btn-ghost">Отмена</button>
          {!item || item.status === "draft" ? (
            <>
              <button disabled={saving} onClick={() => (intent.current = "draft")} className="a-btn-ghost flex-1">{saving ? "…" : "Сохранить черновик"}</button>
              <button disabled={saving} onClick={() => (intent.current = "publish")} className="a-btn-accent flex-[1.4] py-3">{saving ? "Сохраняем…" : "Опубликовать"}</button>
            </>
          ) : (
            <button disabled={saving} onClick={() => (intent.current = "save")} className="a-btn-accent flex-1 py-3">{saving ? "Сохраняем…" : "Сохранить изменения"}</button>
          )}
        </div>
      </div>
    </form>
  );
}
