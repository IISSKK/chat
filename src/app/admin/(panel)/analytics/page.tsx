import Link from "next/link";
import { analyticsReport } from "@/lib/events";
import { requirePagePermission } from "@/lib/admin-guard";

const regionNames = new Intl.DisplayNames(["ru"], { type: "region" });
const country = (c: string) => {
  try {
    return `${c} · ${regionNames.of(c) ?? c}`;
  } catch {
    return c;
  }
};
const SOURCE: Record<string, string> = { direct: "Прямой заход", google: "Google", yandex: "Яндекс", search: "Другие поисковики", instagram: "Instagram", facebook: "Facebook", telegram: "Telegram", whatsapp: "WhatsApp", tiktok: "TikTok", youtube: "YouTube", vk: "ВКонтакте", ok: "Одноклассники", classifieds: "Доски объявлений" };
const sourceName = (s: string) => SOURCE[s] ?? (s.startsWith("utm:") ? `Метка: ${s.slice(4)}` : s.startsWith("site:") ? s.slice(5) : s);
const DEVICE: Record<string, string> = { mobile: "Телефон", desktop: "Компьютер", tablet: "Планшет" };
const KIND: Record<string, string> = { price: "Узнать цену", docs: "Документы / Таможня", generic: "Общая кнопка", partner: "Партнёрство" };

function Bars({ rows, label }: { rows: { name: string; n: number }[]; label: (n: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-400">Пока нет данных</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.name || "—"} className="text-sm">
          <div className="mb-1 flex justify-between gap-2"><span className="truncate">{label(r.name) || "—"}</span><b className="tabular-nums">{r.n}</b></div>
          <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${(r.n / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Top({ rows, empty }: { rows: { id: number; title: string; status: string; n: number }[]; empty: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>;
  return (
    <ol className="divide-y divide-slate-100">
      {rows.map((r, i) => (
        <li key={r.id}>
          <Link href={`/item/${r.id}`} target="_blank" className="flex items-center gap-3 py-2 text-sm hover:text-brand">
            <span className="w-5 text-slate-400">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
            <b className="tabular-nums">{r.n}</b>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requirePagePermission("stats");
  const days = [7, 30, 90].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const r = analyticsReport(days);
  const maxDay = Math.max(1, ...r.daily.map((d) => d.visits));
  const cards: [string, number | string, string][] = [
    ["Посетители", r.visits, "новые визиты за день"],
    ["Просмотры объявлений", r.itemViews, "уникальные"],
    ["Клики WhatsApp", r.waClicks, "по кнопкам на сайте"],
    ["Заявки", r.leads, "с формы"],
    ["Избранное", r.favorites, "добавлений"],
    ["Конверсия", `${r.contactRate}%`, "обращений на 100 посетителей"],
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Аналитика</h1>
          <p className="text-sm text-slate-500">Без IP-адресов и персональных данных. Страны определяет Cloudflare. Действия администраторов не учитываются.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/admin/analytics?days=${d}`} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${d === days ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{d} дн.</Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {cards.map(([l, v, h]) => (
          <div key={l} className="a-card p-4">
            <p className="text-xs font-semibold text-slate-500">{l}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</p>
            <p className="text-xs text-slate-400">{h}</p>
          </div>
        ))}
      </div>

      <div className="a-card p-5">
        <h2 className="mb-4 font-semibold">Посетители и обращения по дням</h2>
        <div className="flex h-36 items-end gap-[3px]">
          {r.daily.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end" title={`${d.day}: ${d.visits} посетителей, ${d.wa} кликов WhatsApp, ${d.leads} заявок`}>
              <div className="w-full rounded-t bg-brand/80 group-hover:bg-brand" style={{ height: `${Math.max(2, (d.visits / maxDay) * 100)}%` }} />
              {(d.wa > 0 || d.leads > 0) && <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-flame" />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Синие столбцы — посетители, оранжевая точка — были клики WhatsApp или заявки.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="a-card p-5"><h2 className="mb-3 font-semibold">Самые просматриваемые</h2><Top rows={r.topViewed} empty="Пока нет просмотров" /></section>
        <section className="a-card p-5"><h2 className="mb-3 font-semibold">Больше всего кликов WhatsApp</h2><Top rows={r.topWa} empty="Пока нет кликов" /></section>
        <section className="a-card p-5"><h2 className="mb-3 font-semibold">Страны</h2><Bars rows={r.countries} label={country} /><p className="mt-3 text-xs text-slate-400">Работает через Cloudflare. Без него страны не определяются.</p></section>
        <section className="a-card p-5"><h2 className="mb-3 font-semibold">Откуда пришли</h2><Bars rows={r.sources} label={sourceName} /></section>
        <section className="a-card p-5"><h2 className="mb-3 font-semibold">Устройства</h2><Bars rows={r.devices} label={(n) => DEVICE[n] ?? n} /></section>
        <section className="a-card p-5"><h2 className="mb-3 font-semibold">Языки сайта</h2><Bars rows={r.langs} label={(n) => ({ ru: "Русский", en: "English", ko: "한국어", zh: "中文" }[n] ?? n)} /></section>
        <section className="a-card p-5 lg:col-span-2"><h2 className="mb-3 font-semibold">Какие кнопки WhatsApp нажимают</h2><Bars rows={r.waByKind} label={(n) => KIND[n] ?? n} /></section>
      </div>
    </div>
  );
}
