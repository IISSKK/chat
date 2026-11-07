import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/admin/registry";
import { RowActions } from "@/components/admin/RowActions";
import { getDictionary } from "@/i18n";

const t = getDictionary("ru"); // админка на русском
import { listItems } from "@/lib/items";
import { CATEGORIES, STATUSES, type Category, type Status } from "@/lib/types";
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
  const status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const q = sp.q?.slice(0, 80) || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total, pages, page: current } = listItems({ type: mod.itemType, category, status, q }, page, 20);

  const pageHref = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (category) s.set("category", category);
    if (status) s.set("status", status);
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

      <form className="a-card grid gap-3 p-3 sm:grid-cols-[1fr_180px_160px_auto]" action={mod.href}>
        <label className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Поиск: название, VIN, серийный номер, год…" className="a-input pl-9" />
        </label>
        <select name="category" defaultValue={category ?? ""} className="a-select">
          <option value="">Все категории</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t.categoriesLong[c]}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} className="a-select">
          <option value="">Любой статус</option>
          <option value="available">В наличии</option>
          <option value="sold">Продано</option>
        </select>
        <div className="flex gap-2">
          <button className="a-btn-primary flex-1">Найти</button>
          {(q || category || status) && <Link href={mod.href} className="a-btn-ghost">Сброс</Link>}
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
                  <span className="inline-flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5" />{formatNumber(i.views)}</span>
                </span>
                {(i.vin || i.serial) && <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400">{i.vin || i.serial}</span>}
              </span>
            </Link>
            <RowActions variant="card" id={i.id} status={i.status} editHref={`${mod.href}/${i.id}`} viewHref={itemPath(i)} title={i.title} canDelete={canDelete} />
          </div>
        ))}
        {!items.length && <div className="a-card px-4 py-12 text-center text-slate-400">Ничего не найдено</div>}
      </div>

      {/* Компьютер: таблица */}
      <div className="a-card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Категория</th>
                <th className="px-4 py-3">Год</th>
                <th className="px-4 py-3">VIN / S/N</th>
                <th className="px-4 py-3">Просмотры</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {i.photos[0] && <img src={photoUrl(i.photos[0].filename)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      </span>
                      <div className="min-w-0">
                        <Link href={`${mod.href}/${i.id}`} className="block max-w-[280px] truncate font-semibold hover:text-ember">{i.title}</Link>
                        <span className="text-xs text-slate-400">
                          #{i.id} · {i.photos.length} фото{i.mileage !== null ? ` · ${formatNumber(i.mileage)} км` : ""}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{t.categories[i.category]}</span></td>
                  <td className="px-4 py-3">{i.year ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{i.vin || i.serial || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <span className="inline-flex items-center gap-1 tabular-nums"><EyeIcon className="h-4 w-4" />{formatNumber(i.views)}</span>
                  </td>
                  <RowActions id={i.id} status={i.status} editHref={`${mod.href}/${i.id}`} viewHref={itemPath(i)} title={i.title} canDelete={canDelete} />
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
