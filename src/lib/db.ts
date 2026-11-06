import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedDemoData } from "./seed";

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

    CREATE TABLE IF NOT EXISTS visits (
      day TEXT NOT NULL,
      visitor TEXT NOT NULL,
      hits INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (day, visitor)
    );
  `);
}

export function getDb(): DB {
  if (globalForDb.__db) return globalForDb.__db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  migrate(db);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM items").get() as { n: number };
  if (n === 0 && process.env.SEED_DEMO !== "false") seedDemoData(db);
  globalForDb.__db = db;
  return db;
}
