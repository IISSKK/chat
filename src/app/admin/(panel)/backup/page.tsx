import fs from "node:fs";
import path from "node:path";
import { getDb, UPLOAD_DIR } from "@/lib/db";
import { requirePagePermission } from "@/lib/admin-guard";
import { DownloadIcon } from "@/components/icons";

const mb = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} КБ` : `${(b / 1024 / 1024).toFixed(b > 100 * 1024 * 1024 ? 0 : 1)} МБ`);

export default async function BackupPage() {
  await requirePagePermission("backup");
  getDb();
  const dbFile = path.resolve(process.env.DATABASE_PATH || "./data/app.db");
  const dbSize = fs.existsSync(dbFile) ? fs.statSync(dbFile).size : 0;
  let photos = 0;
  let photoBytes = 0;
  for (const f of fs.readdirSync(UPLOAD_DIR)) {
    if (!/^[a-f0-9]{24}\.(jpg|webp|png|avif|gif)$/.test(f)) continue;
    photos++;
    photoBytes += fs.statSync(path.join(UPLOAD_DIR, f)).size;
  }
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Резервная копия</h1>
        <p className="text-sm text-slate-500">
          Копия создаётся в момент нажатия и сразу скачивается на ваше устройство. <b>На сервере ничего не сохраняется</b> — место не занимается.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="a-card flex flex-col gap-3 p-5">
          <h2 className="font-semibold">Только база</h2>
          <p className="flex-1 text-sm text-slate-500">Объявления, заявки, настройки, администраторы, журнал. Маленький файл — удобно делать каждый день.</p>
          <p className="text-xs text-slate-400">≈ {mb(dbSize)} (в архиве меньше)</p>
          <a href="/api/admin/backup" className="a-btn-accent"><DownloadIcon className="h-4 w-4" /> Скачать базу</a>
        </section>
        <section className="a-card flex flex-col gap-3 p-5">
          <h2 className="font-semibold">База и фотографии</h2>
          <p className="flex-1 text-sm text-slate-500">Полная копия сайта: {photos} фото. Лучше делать раз в неделю или перед большими изменениями.</p>
          <p className="text-xs text-slate-400">≈ {mb(dbSize + photoBytes)}</p>
          <a href="/api/admin/backup?photos=1" className="a-btn-primary"><DownloadIcon className="h-4 w-4" /> Скачать всё</a>
        </section>
      </div>
      <section className="a-card space-y-2 p-5 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Как восстановить</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Остановите сайт на сервере: <code className="rounded bg-slate-100 px-1.5 py-0.5">pm2 stop barakat</code></li>
          <li>Замените <code className="rounded bg-slate-100 px-1.5 py-0.5">data/app.db</code> файлом <code className="rounded bg-slate-100 px-1.5 py-0.5">app.db</code> из архива (удалите рядом <code>app.db-wal</code> и <code>app.db-shm</code>).</li>
          <li>Папку <code className="rounded bg-slate-100 px-1.5 py-0.5">uploads/</code> из архива положите в <code className="rounded bg-slate-100 px-1.5 py-0.5">data/uploads/</code>.</li>
          <li>Запустите: <code className="rounded bg-slate-100 px-1.5 py-0.5">pm2 start barakat</code></li>
        </ol>
        <p className="text-xs text-slate-400">Архив содержит заявки клиентов и хеши паролей — храните его в надёжном месте, не пересылайте по почте и мессенджерам.</p>
      </section>
    </div>
  );
}
