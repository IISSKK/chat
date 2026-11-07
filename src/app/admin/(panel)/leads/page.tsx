import Link from "next/link";
import { LeadsBoard } from "@/components/admin/LeadsBoard";
import { LEAD_STATUSES, leadCounts, listLeads, type LeadStatus } from "@/lib/leads";
import { requirePagePermission } from "@/lib/admin-guard";
import { can } from "@/lib/admins";

const LABEL: Record<string, string> = { all: "Все", new: "Новые", in_progress: "В работе", deal: "Сделка", closed: "Закрыты" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const admin = await requirePagePermission("leads");
  const sp = await searchParams;
  const status = (LEAD_STATUSES as readonly string[]).includes(sp.status || "") ? (sp.status as LeadStatus) : undefined;
  const { rows, total, page, pages } = listLeads({ status, page: Number(sp.page) || 1 });
  const counts = leadCounts();
  const tabs = ["all", ...LEAD_STATUSES] as const;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Заявки</h1>
        <p className="text-sm text-slate-500">Обращения с сайта. Новые приходят и в Telegram, если он подключён.</p>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => {
          const on = (t === "all" && !status) || t === status;
          return (
            <Link key={t} href={t === "all" ? "/admin/leads" : `/admin/leads?status=${t}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
              {LABEL[t]} <span className={on ? "text-white/70" : "text-slate-400"}>{counts[t]}</span>
            </Link>
          );
        })}
      </div>
      <LeadsBoard leads={rows} canDelete={can(admin, "delete")} />
      {pages > 1 && (
        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/leads?${status ? `status=${status}&` : ""}page=${p}`} className={`grid h-11 min-w-11 place-items-center rounded-lg px-2 text-sm font-semibold md:h-9 md:min-w-9 ${p === page ? "bg-slate-900 text-white" : "hover:bg-white"}`}>{p}</Link>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-slate-400">Всего: {total}</p>
    </div>
  );
}
