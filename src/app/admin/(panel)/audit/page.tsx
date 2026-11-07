import Link from "next/link";
import { listAudit } from "@/lib/audit";
import { requirePagePermission } from "@/lib/admin-guard";

const ACTION: Record<string, string> = {
  login: "Вход", login_failed: "Неудачный вход", "2fa_failed": "Неверный код 2FA", "2fa_enabled": "Включена 2FA", "2fa_disabled": "Отключена 2FA", "2fa_recovery_used": "Резервный код 2FA", "2fa_recovery_regenerated": "Новые резервные коды",
  password_changed: "Смена пароля", logout_all: "Выход на всех устройствах",
  item_create: "Создано объявление", item_update: "Изменено объявление", item_status: "Смена статуса", item_trash: "В корзину", item_restore: "Из корзины", item_purge: "Удалено навсегда",
  admin_create: "Добавлен админ", admin_update: "Изменён админ", admin_delete: "Удалён админ", admin_reset_2fa: "Сброс 2FA админа",
  contacts_update: "Изменены номера WhatsApp", lead_update: "Заявка изменена", lead_delete: "Заявка удалена",
  brand_add: "Добавлена марка", model_add: "Добавлена модель", renameBrand: "Марка переименована", renameModel: "Модель переименована", deleteBrand: "Марка удалена", deleteModel: "Модель удалена",
  block_unlock: "Снята блокировка входа",
  addGeneration: "Добавлено поколение", updateGeneration: "Изменено поколение", deleteGeneration: "Удалено поколение",
  cover_set: "Изменена обложка главной", cover_clear: "Обложка главной сброшена",
  backup_download: "Скачана резервная копия", translate: "Перевод объявления", translate_all: "Перевод всех объявлений",
};
const danger = (a: string) => /failed|purge|delete|reset|disabled|trash/.test(a);

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ actor?: string; page?: string }> }) {
  await requirePagePermission("audit");
  const sp = await searchParams;
  const { rows, total, page, pages, actors } = listAudit({ actor: sp.actor, page: Number(sp.page) || 1 });
  const href = (p: number, actor = sp.actor) => `/admin/audit?${actor ? `actor=${encodeURIComponent(actor)}&` : ""}page=${p}`;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Журнал действий</h1>
        <p className="text-sm text-slate-500">Кто и что менял в админке, а также входы. Записи старше 180 дней удаляются автоматически.</p>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Link href="/admin/audit" className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${!sp.actor ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Все</Link>
        {actors.map((a) => (
          <Link key={a} href={href(1, a)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${sp.actor === a ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{a}</Link>
        ))}
      </div>
      <div className="a-card divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-3 text-sm">
            <span className="w-36 shrink-0 font-mono text-xs text-slate-400">{r.ts.slice(0, 16)} UTC</span>
            <span className="font-semibold">{r.actor}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${danger(r.action) ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>{ACTION[r.action] ?? r.action}</span>
            <span className="min-w-0 flex-1 truncate text-slate-500">{r.details}</span>
          </div>
        ))}
        {!rows.length && <p className="px-4 py-12 text-center text-slate-400">Записей пока нет</p>}
      </div>
      {pages > 1 && (
        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: Math.min(pages, 30) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={href(p)} className={`grid h-11 min-w-11 place-items-center rounded-lg px-2 text-sm font-semibold md:h-9 md:min-w-9 ${p === page ? "bg-slate-900 text-white" : "hover:bg-white"}`}>{p}</Link>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-slate-400">Всего записей: {total}</p>
    </div>
  );
}
