import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import yazl from "yazl";
import { getDb, UPLOAD_DIR } from "@/lib/db";
import { requireApiPermission } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { allow } from "@/lib/ratelimit";
import { sendTelegram, tgEscape } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const README = `Резервная копия сайта Barakat Auto
==================================
app.db      — база данных (объявления, заявки, настройки, администраторы, журнал).
uploads/    — фотографии объявлений (если копия «с фото»).

Как восстановить на сервере:
 1. Остановите сайт (pm2 stop barakat).
 2. Замените файл data/app.db на app.db из архива (и удалите рядом app.db-wal и app.db-shm, если они есть).
 3. Папку uploads/ из архива положите в data/uploads/ (миниатюры создаются автоматически при показе).
 4. Запустите сайт (pm2 start barakat).
Копия содержит хеши паролей и заявки клиентов — храните её в надёжном месте и не пересылайте по почте.
`;

/**
 * Скачивание резервной копии «на лету»: на сервере ничего не сохраняется.
 * Снимок базы делается во временный файл, который сразу удаляется после отправки. Фото уже сжаты, поэтому кладутся без перепаковки;
 * миниатюры (_sm) не включаются — они пересоздаются сами.
 *   ?photos=1 — добавить фотографии
 */
export async function GET(req: NextRequest) {
  const admin = await requireApiPermission("backup");
  if (admin instanceof NextResponse) return admin;
  if (!allow(`backup:${admin.id}`, 6, 60 * 60_000)) return NextResponse.json({ error: "Слишком часто. Подождите немного." }, { status: 429 });
  const withPhotos = req.nextUrl.searchParams.get("photos") === "1";

  const tmp = path.join(os.tmpdir(), `barakat-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.db`);
  getDb().prepare("VACUUM INTO ?").run(tmp);
  const cleanup = () => fs.promises.unlink(tmp).catch(() => {});

  const zip = new yazl.ZipFile();
  zip.addFile(tmp, "app.db");
  zip.addBuffer(Buffer.from(README, "utf8"), "README.txt");
  let files = 0;
  if (withPhotos) {
    for (const name of fs.readdirSync(UPLOAD_DIR)) {
      if (!/^[a-f0-9]{24}\.(jpg|webp|png|avif|gif)$/.test(name)) continue; // без миниатюр _sm
      zip.addFile(path.join(UPLOAD_DIR, name), `uploads/${name}`, { compress: false });
      files++;
    }
  }
  zip.end();
  zip.outputStream.once("close", cleanup);
  zip.outputStream.once("error", cleanup);

  logAudit(admin.username, "backup_download", "", "", withPhotos ? `с фото (${files})` : "только база");
  void sendTelegram(`💾 <b>Скачана резервная копия</b> (${withPhotos ? `с фото: ${files}` : "только база"})\nКто: ${tgEscape(admin.username)}`);

  const date = new Date().toISOString().slice(0, 10);
  return new Response(Readable.toWeb(zip.outputStream) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="barakat-backup-${date}${withPhotos ? "-with-photos" : ""}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
