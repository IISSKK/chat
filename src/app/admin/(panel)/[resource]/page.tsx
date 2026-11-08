import { Select } from "@/components/ui/Select";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/admin/registry";
import { RowActions } from "@/components/admin/RowActions";
import { getDictionary } from "@/i18n";

const t = getDictionary("ru"); // админка на русском
import { countBy, listItems } from "@/lib/items";
import { generationFor, getGeneration, listBrands } from "@/lib/catalog-refs";
import { BODIES, CATEGORIES, STATUSES, type Category, type Status } from "@/lib/types";
import { formatNumber, itemPath, photoUrl } from "@/lib/utils";
import { EyeIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { requirePagePermission } from "@/lib/admin-guard";
import { can } from "@/lib/admins";

type Props = { params: Promise<{ resource: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function ResourceList({ params, searchParams }: Props) {
  const mod = getResource((await params).resource);
  if (!mod) notFound();
  const admin = await requirePagePermission(mod.permission);
  const canDelete = can(admin, "delete");
  const sp = await searchParams;
  const category = CATEGORIES.includes(sp.category as Category) ? (sp.category as Category) : undefined;
  const view = sp.view === "trash" ? "trash" : "all";
  const status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const q = sp.q?.slice(0, 80) || undefined;
  const body = mod.itemType === "car" && (BODIES as readonly string[]).includes(sp.body ?? "") ? sp.body : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  // Модель и поколение (только автомобили: у двигателей модель вводится свободным текстом)
  const refs = mod.itemType === "car" ? listBrands() : [];
  const genId = Number(sp.gen);
  const gen = Number.isInteger(genId) && genId > 0 ? getGeneration(genId) : null;
  const model = gen?.model ?? (sp.model?.slice(0, 60) || undefined);
  const modelOptions = refs.flatMap((b) => b.models.map((m) => ({ value: m.name, label: `${b.name} ${m.name}` })));
  const genOptions = refs.flatMap((b) => b.models.flatMap((m) => (m.generations ?? []).map((g) => ({ value: String(g.id), label: `${b.name} ${m.name} · ${g.name} (${g.year_from}–${g.year_to})` }))));
  const { items, total, pages, page: current } = listItems(
    { type: mod.itemType, category, status, q, model, body, brand: gen?.brand, yearFrom: gen?.year_from, yearTo: gen?.year_to, includeDrafts: true, trash: view === "trash" },
    page,
    20,
  );
  const drafts = countBy({ type: mod.itemType, status: "draft", includeDrafts: true });
  const trashed = countBy({ type: mod.itemType, includeDrafts: true, trash: true });

  const pageHref = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (category) s.set("category", category);
    if (status) s.set("status", status);
    if (body) s.set("body", body);
    if (gen) s.set("gen", String(gen.id));
    else if (model) s.set("model", model);
    if (view === "trash") s.set("view", "trash");
    if (p > 1) s.set("page", String(p));
    return `${mod.href}?${s}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{mod.title}</h1>
          <p className="text-sm text-slate-500">Всего: {total}</p>
        </div>
        <Link href={`${mod.href}/new`} className="a-btn-accent">
          <PlusIcon className="h-4 w-4" /> Добавить {mod.singular}
        </Link>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[
          { href: mod.href, label: "Все", on: view === "all" && !status },
          { href: `${mod.href}?status=draft`, label: `Черновики${drafts ? ` · ${drafts}` : ""}`, on: view === "all" && status === "draft" },
          { href: `${mod.href}?view=trash`, label: `Корзина${trashed ? ` · ${trashed}` : ""}`, on: view === "trash" },
        ].map((t) => (
          <Link key={t.label} href={t.href} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${t.on ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{t.label}</Link>
        ))}
      </div>
      {view === "trash" && <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">В корзине объявления лежат 30 дней, потом удаляются автоматически. Отсюда их можно вернуть.</p>}

      <form className="a-card space-y-3 p-3" action={mod.href}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="Поиск: название, модель, поколение, кузов, VIN, год…" className="a-input pl-9" />
          </label>
          <div className="flex gap-2">
            <button className="a-btn-primary flex-1">Найти</button>
            {(q || category || status || model || gen || body) && <Link href={mod.href} className="a-btn-ghost">Сброс</Link>}
          </div>
        </div>
        <div className={`grid gap-3 sm:grid-cols-2 ${refs.length ? "lg:grid-cols-5" : "lg:grid-cols-2"}`}>
          <Select variant="admin" name="category" defaultValue={category ?? ""} aria-label="Категория" options={[{ value: "", label: "Все категории" }, ...CATEGORIES.map((c) => ({ value: c, label: t.categoriesLong[c] }))]} />
          <Select variant="admin" name="status" defaultValue={status ?? ""} aria-label="Статус" options={[{ value: "", label: "Любой статус" }, { value: "available", label: "В наличии" }, { value: "sold", label: "Продано" }, { value: "draft", label: "Черновик" }]} />
          {refs.length > 0 && <Select variant="admin" name="body" defaultValue={body ?? ""} aria-label="Кузов" options={[{ value: "", label: "Любой кузов" }, ...BODIES.map((b) => ({ value: b, label: t.body[b] }))]} />}
          {refs.length > 0 && <Select variant="admin" name="model" defaultValue={gen ? "" : model ?? ""} aria-label="Модель" searchPlaceholder="Найти модель…" options={[{ value: "", label: "Любая модель" }, ...modelOptions]} />}
          {refs.length > 0 && <Select variant="admin" name="gen" defaultValue={gen ? String(gen.id) : ""} aria-label="Поколение" searchPlaceholder="Найти поколение…" options={[{ value: "", label: "Любое поколение" }, ...genOptions]} />}
        </div>
      </form>

      {/* Телефон: карточки */}
      <div className="space-y-3 md:hidden">
        {items.map((i) => (
          <div key={i.id} className="a-card space-y-3 p-3">
            <Link href={`${mod.href}/${i.id}`} className="flex items-center gap-3">
              <span className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {i.photos[0] && <img src={photoUrl(i.photos[0].filename, "sm")} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-semibold leading-snug">{i.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{t.categories[i.category]}</span>
                  {i.year && <span>{i.year}</span>}
                  {i.body && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{t.body[i.body as keyof typeof t.body] ?? i.body}</span>}
                  {(() => { const g = i.type === "car" ? generationFor(i.brand, i.model, i.year) : null; return g ? <span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">{g.name}</span> : null; })()}
                  <span className="inline-flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5" />{formatNumber(i.views)}</span>
                </span>
                {(i.vin || i.serial) && <span className="mt-0.5 block truncate font-mono text-xs text-slate-400">{i.vin || i.serial}</span>}
              </span>
            </Link>
            <RowActions variant="card" id={i.id} status={i.status} editHref={`${mod.href}/${i.id}`} viewHref={itemPath(i)} title={i.title} canDelete={canDelete} trash={view === "trash"} />
          </div>
        ))}
        {!items.length && <div className="a-card px-4 py-12 text-center text-slate-400">Ничего не найдено</div>}
      </div>

      {/* Компьютер: таблица */}
      <div className="a-card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-3">Товар</th>
                <th className="hidden px-3 py-3 xl:table-cell">Категория</th>
                <th className="px-3 py-3">Год</th>
                <th className="hidden px-3 py-3 2xl:table-cell">VIN / S/N</th>
                <th className="hidden px-3 py-3 2xl:table-cell">Просмотры</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {i.photos[0] && <img src={photoUrl(i.photos[0].filename)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      </span>
                      <div className="min-w-0">
                        <Link href={`${mod.href}/${i.id}`} className="block max-w-[190px] truncate xl:max-w-[200px] font-semibold hover:text-ember">{i.title}</Link>
                        <span className="text-xs text-slate-400">
                          #{i.id} · {i.photos.length} фото{i.mileage !== null ? ` · ${formatNumber(i.mileage)} км` : ""}
                          <span className="xl:hidden"> · {t.categories[i.category]}</span>
                          {(i.vin || i.serial) && <span className="block truncate font-mono text-xs text-slate-400 2xl:hidden">{i.vin || i.serial}</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 xl:table-cell"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{t.categories[i.category]}</span></td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {i.year ?? "—"}
                    {i.body && <span className="mt-0.5 block text-xs text-slate-500">{(t.body[i.body as keyof typeof t.body] ?? i.body).replace(/\s*\(.*\)/, "")}</span>}
                    {(() => { const g = i.type === "car" ? generationFor(i.brand, i.model, i.year) : null; return g ? <span className="mt-0.5 block text-xs font-semibold text-brand">{g.name}</span> : null; })()}
                  </td>
                  <td className="hidden px-3 py-3 font-mono text-xs text-slate-500 2xl:table-cell">{i.vin || i.serial || "—"}</td>
                  <td className="hidden px-3 py-3 text-slate-500 2xl:table-cell">
                    <span className="inline-flex items-center gap-1 tabular-nums"><EyeIcon className="h-4 w-4" />{formatNumber(i.views)}</span>
                  </td>
                  <RowActions id={i.id} status={i.status} editHref={`${mod.href}/${i.id}`} viewHref={itemPath(i)} title={i.title} canDelete={canDelete} trash={view === "trash"} />
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">Ничего не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={pageHref(p)} className={`grid h-11 min-w-11 place-items-center rounded-lg px-2 text-sm font-semibold md:h-9 md:min-w-9 ${p === current ? "bg-slate-900 text-white" : "hover:bg-white"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
