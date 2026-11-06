import Link from "next/link";
import { catalogModules } from "@/admin/modules/catalog";
import { StatsCards, VisitsChart } from "@/components/admin/StatsCards";
import { countBy, listItems } from "@/lib/items";
import { getDailyVisits, getVisitStats } from "@/lib/visits";
import { formatNumber, photoUrl } from "@/lib/utils";
import { getResourceByType } from "@/admin/registry";
import { requirePagePermission } from "@/lib/admin-guard";
import { can } from "@/lib/admins";
import { onlineCount } from "@/lib/presence";
import { EyeIcon } from "@/components/icons";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const admin = await requirePagePermission();
  const denied = (await searchParams).denied;
  const allowed = catalogModules.filter((m) => !m.permission || can(admin, m.permission));
  const recent = allowed.length
    ? listItems({}, 1, 12).items.filter((i) => allowed.some((m) => m.itemType === i.type)).slice(0, 6)
    : [];
  const showStats = can(admin, "stats");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Обзор</h1>
        <p className="text-sm text-slate-500">Здравствуйте, {admin.username}!</p>
      </div>

      {denied && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          У вас нет доступа к этому разделу. Обратитесь к владельцу сайта.
        </p>
      )}

      {showStats && <StatsCards stats={getVisitStats()} online={onlineCount()} />}

      {allowed.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {allowed.map((m) => {
            const total = countBy({ type: m.itemType });
            const sold = countBy({ type: m.itemType, status: "sold" });
            return (
              <Link key={m.id} href={m.href} className="a-card group p-5 transition hover:border-brand/40 hover:shadow-md">
                <p className="text-sm font-semibold text-slate-500">{m.title}</p>
                <p className="mt-1 font-display text-3xl font-bold">{total}</p>
                <p className="mt-1 text-xs text-slate-400">
                  в наличии {total - sold} · продано {sold}
                </p>
                <span className="mt-3 inline-block text-xs font-semibold text-brand group-hover:underline">Управлять →</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {showStats && <VisitsChart data={getDailyVisits(30)} />}
        {recent.length > 0 && (
          <div className="a-card p-5">
            <h2 className="mb-3 font-semibold">Последние изменения</h2>
            <ul className="divide-y divide-slate-100">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link href={`${getResourceByType(i.type)?.href}/${i.id}`} className="flex items-center gap-3 py-2.5 hover:text-brand">
                    <span className="h-10 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {i.photos[0] && <img src={photoUrl(i.photos[0].filename, "sm")} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.title}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <EyeIcon className="h-3.5 w-3.5" /> {formatNumber(i.views)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
