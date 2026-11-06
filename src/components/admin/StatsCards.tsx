import type { VisitStats } from "@/lib/visits";

export function StatsCards({ stats }: { stats: VisitStats }) {
  const cells: [string, number, string][] = [
    ["Сегодня", stats.today, "from-brand/40"],
    ["За неделю", stats.week, "from-glow/40"],
    ["За месяц", stats.month, "from-ember/30"],
    ["Всего", stats.total, "from-flame/30"],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cells.map(([label, n, g]) => (
        <div key={label} className="a-card relative overflow-hidden p-5">
          <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${g} to-transparent blur-xl`} />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="relative mt-2 font-display text-3xl font-bold tabular-nums">{new Intl.NumberFormat("ru-RU").format(n)}</p>
          <p className="relative text-xs text-slate-400">уникальных посетителей</p>
        </div>
      ))}
    </div>
  );
}

export function VisitsChart({ data }: { data: { day: string; visitors: number; hits: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.visitors));
  return (
    <div className="a-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Посетители за 30 дней</h2>
        <span className="text-xs text-slate-400">по дням (UTC)</span>
      </div>
      <div className="flex h-40 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-ember/80 transition-colors group-hover:bg-ember"
              style={{ height: `${Math.max(2, (d.visitors / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white group-hover:block">
              {d.day.slice(5)}: {d.visitors} чел. / {d.hits} визитов
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}
