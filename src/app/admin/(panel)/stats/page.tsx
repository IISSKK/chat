import { StatsCards, VisitsChart } from "@/components/admin/StatsCards";
import { getDailyVisits, getVisitStats } from "@/lib/visits";

export default function StatsPage() {
  const daily = getDailyVisits(30);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Статистика посещений</h1>
        <p className="text-sm text-slate-500">Уникальные посетители (анонимный cookie, боты исключены)</p>
      </div>
      <StatsCards stats={getVisitStats()} />
      <VisitsChart data={daily} />
      <div className="a-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-4 py-3">Дата</th><th className="px-4 py-3">Посетители</th><th className="px-4 py-3">Визиты</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...daily].reverse().map((d) => (
              <tr key={d.day}><td className="px-4 py-2.5">{d.day}</td><td className="px-4 py-2.5 font-semibold">{d.visitors}</td><td className="px-4 py-2.5 text-slate-500">{d.hits}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
