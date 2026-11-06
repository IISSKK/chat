/** Удаляет файл базы SQLite. При следующем запуске сайта база создастся заново с демо-данными
 *  (если не задано SEED_DEMO=false). Загруженные фото в data/uploads не трогаются. */
import fs from "node:fs";
import path from "node:path";

const db = path.resolve(process.env.DATABASE_PATH || "./data/app.db");
for (const f of [db, `${db}-wal`, `${db}-shm`]) {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log("removed", f);
  }
}
console.log("Готово. Запустите сайт — демо-данные будут загружены автоматически.");
