import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedDemoData } from "./seed";
import { importFromItems } from "./catalog-refs";

const DB_PATH = path.resolve(process.env.DATABASE_PATH || "./data/app.db");
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");

export type DB = DatabaseSync;

const globalForDb = globalThis as unknown as { __db?: DB };

/** Выполняет fn в транзакции (встроенный node:sqlite не имеет db.transaction). */
export function transaction<T>(db: DB, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function migrate(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'listing',
      slug TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      year INTEGER,
      first_registration TEXT NOT NULL DEFAULT '',
      vin TEXT NOT NULL DEFAULT '',
      serial TEXT NOT NULL DEFAULT '',
      engine_code TEXT NOT NULL DEFAULT '',
      displacement INTEGER,
      transmission TEXT NOT NULL DEFAULT '',
      mileage INTEGER,
      fuel TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'available',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type, category, status);
    CREATE INDEX IF NOT EXISTS idx_items_vin ON items(vin);
    CREATE INDEX IF NOT EXISTS idx_items_serial ON items(serial);

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_photos_item ON photos(item_id, position);

    CREATE TABLE IF NOT EXISTS item_views (
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      visitor TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (item_id, visitor)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Справочник марок и моделей (в форме объявления выбирается из списка — без опечаток)
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name TEXT NOT NULL COLLATE NOCASE,
      slug TEXT NOT NULL,
      UNIQUE (brand_id, name),
      UNIQUE (brand_id, slug)
    );

    -- Автоперевод объявлений
    CREATE TABLE IF NOT EXISTS item_translations (
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      lang TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      src_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (item_id, lang)
    );
    CREATE TABLE IF NOT EXISTS translation_state (
      item_id INTEGER PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
      status TEXT NOT NULL,            -- pending | ok | error | off
      error TEXT NOT NULL DEFAULT '',
      src_hash TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Заявки с сайта
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
      item_title TEXT NOT NULL DEFAULT '',
      lang TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',   -- new | in_progress | deal | closed
      note TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at);

    -- События для аналитики (без IP и персональных данных)
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (datetime('now')),
      day TEXT NOT NULL,
      type TEXT NOT NULL,              -- visit | item_view | wa_click | lead | favorite
      item_id INTEGER,
      detail TEXT NOT NULL DEFAULT '', -- например kind=price
      country TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT '',
      lang TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_events_day ON events(day, type);
    CREATE INDEX IF NOT EXISTS idx_events_item ON events(item_id, type);

    -- Журнал действий администраторов
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (datetime('now')),
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL DEFAULT '',
      entity_id TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);

    -- «Кто онлайн» и ограничения частоты — в общей БД, чтобы работали при нескольких процессах (PM2 cluster)
    CREATE TABLE IF NOT EXISTS presence (
      visitor TEXT PRIMARY KEY,
      seen_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      locks INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS visits (
      day TEXT NOT NULL,
      visitor TEXT NOT NULL,
      hits INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (day, visitor)
    );
  `);
  // Миграции для существующих баз
  const cols = (db.prepare("PRAGMA table_info(items)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("views")) db.exec("ALTER TABLE items ADD COLUMN views INTEGER NOT NULL DEFAULT 0");
  if (!cols.includes("video_url")) db.exec("ALTER TABLE items ADD COLUMN video_url TEXT NOT NULL DEFAULT ''");
  if (!cols.includes("deleted_at")) db.exec("ALTER TABLE items ADD COLUMN deleted_at TEXT");
  const acols = (db.prepare("PRAGMA table_info(admins)").all() as { name: string }[]).map((c) => c.name);
  if (!acols.includes("totp_secret")) db.exec("ALTER TABLE admins ADD COLUMN totp_secret TEXT NOT NULL DEFAULT ''");
  if (!acols.includes("totp_enabled")) db.exec("ALTER TABLE admins ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0");
  if (!acols.includes("recovery_codes")) db.exec("ALTER TABLE admins ADD COLUMN recovery_codes TEXT NOT NULL DEFAULT '[]'");
  db.exec("CREATE INDEX IF NOT EXISTS idx_items_deleted ON items(deleted_at, status)");
  // Раздел «Запчасти» удалён — убираем его позиции
  db.exec("DELETE FROM items WHERE type NOT IN ('car', 'engine')");
}

export function getDb(): DB {
  if (globalForDb.__db) return globalForDb.__db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  migrate(db);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM items").get() as { n: number };
  const seed = process.env.SEED_DEMO ? process.env.SEED_DEMO === "true" : process.env.NODE_ENV !== "production";
  if (n === 0 && seed) seedDemoData(db);
  globalForDb.__db = db;
  try {
    // подтягиваем марки и модели существующих объявлений в справочник
    importFromItems();
  } catch {}
  return db;
}
