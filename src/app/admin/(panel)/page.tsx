import Link from "next/link";
import { catalogModules } from "@/admin/modules/catalog";
import { StatsCards, VisitsChart } from "@/components/admin/StatsCards";
import { countBy, listItems } from "@/lib/items";
import { getDailyVisits, getVisitStats } from "@/lib/visits";
import { photoUrl } from "@/lib/utils";
import { getResourceByType } from "@/admin/registry";

export default function AdminDashboard() {
  const recent = listItems({}, 1, 6).items;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Обзор</h1>
        <p className="text-sm text-slate-500">Сводка по каталогу и посещаемости</p>
      </div>

      <StatsCards stats={getVisitStats()} />

      <div className="grid gap-3 sm:grid-cols-3">
        {catalogModules.map((m) => {
          const total = countBy({ type: m.itemType });
          const sold = countBy({ type: m.itemType, status: "sold" });
          return (
            <Link key={m.id} href={m.href} className="a-card group p-5 transition hover:border-violet/40 hover:shadow-md">
              <p className="text-sm font-semibold text-slate-500">{m.title}</p>
              <p className="mt-1 font-display text-3xl font-bold">{total}</p>
              <p className="mt-1 text-xs text-slate-400">
                в наличии {total - sold} · продано {sold}
              </p>
              <span className="mt-3 inline-block text-xs font-semibold text-violet group-hover:underline">Управлять →</span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <VisitsChart data={getDailyVisits(30)} />
        <div className="a-card p-5">
          <h2 className="mb-3 font-semibold">Последние изменения</h2>
          <ul className="divide-y divide-slate-100">
            {recent.map((i) => (
              <li key={i.id}>
                <Link href={`${getResourceByType(i.type)?.href}/${i.id}`} className="flex items-center gap-3 py-2.5 hover:text-violet">
                  <span className="h-10 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {i.photos[0] && <img src={photoUrl(i.photos[0].filename)} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.title}</span>
                  <span className="text-xs text-slate-400">{i.updated_at.slice(5, 16)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
