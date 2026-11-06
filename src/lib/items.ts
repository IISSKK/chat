import "server-only";
import { getDb } from "./db";
import { slugify } from "./utils";
import type { Item, ItemFilters, ItemInput, Photo } from "./types";

type Row = Omit<Item, "photos">;

function attachPhotos(rows: Row[]): Item[] {
  if (!rows.length) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const photos = db
    .prepare(`SELECT * FROM photos WHERE item_id IN (${ids.map(() => "?").join(",")}) ORDER BY position, id`)
    .all(...ids) as Photo[];
  const byItem = new Map<number, Photo[]>();
  for (const p of photos) {
    const list = byItem.get(p.item_id) ?? [];
    list.push(p);
    byItem.set(p.item_id, list);
  }
  return rows.map((r) => ({ ...r, photos: byItem.get(r.id) ?? [] }));
}

function buildWhere(f: ItemFilters) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (f.type) (where.push("type = ?"), params.push(f.type));
  if (f.category) (where.push("category = ?"), params.push(f.category));
  if (f.status) (where.push("status = ?"), params.push(f.status));
  if (f.brand) (where.push("brand = ? COLLATE NOCASE"), params.push(f.brand));
  if (f.year) (where.push("year = ?"), params.push(f.year));
  if (f.yearFrom) (where.push("year >= ?"), params.push(f.yearFrom));
  if (f.yearTo) (where.push("year <= ?"), params.push(f.yearTo));
  if (f.fuel) (where.push("fuel = ?"), params.push(f.fuel));
  if (f.transmission) (where.push("transmission = ?"), params.push(f.transmission));
  if (f.q && f.q.trim()) {
    const terms = f.q.trim().split(/\s+/).slice(0, 6);
    for (const term of terms) {
      const like = `%${term}%`;
      where.push(
        "(title LIKE ? OR brand LIKE ? OR model LIKE ? OR vin LIKE ? OR serial LIKE ? OR engine_code LIKE ? OR CAST(year AS TEXT) = ?)",
      );
      params.push(like, like, like, like, like, like, term);
    }
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export function listItems(f: ItemFilters, page = 1, perPage = 12) {
  const db = getDb();
  const { sql, params } = buildWhere(f);
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM items ${sql}`).get(...params) as { total: number };
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const rows = db
    .prepare(
      `SELECT * FROM items ${sql} ORDER BY (status = 'sold'), datetime(updated_at) DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, (current - 1) * perPage) as Row[];
  return { items: attachPhotos(rows), total, page: current, pages };
}

export function getItem(id: number): Item | null {
  const row = getDb().prepare("SELECT * FROM items WHERE id = ?").get(id) as Row | undefined;
  return row ? attachPhotos([row])[0] : null;
}

export function countBy(f: ItemFilters) {
  const { sql, params } = buildWhere(f);
  return (getDb().prepare(`SELECT COUNT(*) AS n FROM items ${sql}`).get(...params) as { n: number }).n;
}

export function facetValues(f: ItemFilters) {
  const db = getDb();
  const { sql, params } = buildWhere({ type: f.type, category: f.category });
  const and = sql ? `${sql} AND` : "WHERE";
  const brands = (
    db.prepare(`SELECT DISTINCT brand FROM items ${and} brand <> '' ORDER BY brand`).all(...params) as { brand: string }[]
  ).map((r) => r.brand);
  const years = (
    db.prepare(`SELECT DISTINCT year FROM items ${and} year IS NOT NULL ORDER BY year DESC`).all(...params) as {
      year: number;
    }[]
  ).map((r) => r.year);
  return { brands, years };
}

export interface Suggestion {
  id: number;
  slug: string;
  title: string;
  type: Item["type"];
  match: string;
  field: "vin" | "serial" | "model" | "year" | "engine_code";
  photo?: string;
  status: Item["status"];
}

export function suggest(q: string, limit = 8): Suggestion[] {
  const term = q.trim();
  if (term.length < 2) return [];
  const like = `%${term}%`;
  const rows = getDb()
    .prepare(
      `SELECT i.*, (SELECT filename FROM photos p WHERE p.item_id = i.id ORDER BY position LIMIT 1) AS photo
       FROM items i
       WHERE vin LIKE ? OR serial LIKE ? OR title LIKE ? OR model LIKE ? OR brand LIKE ? OR engine_code LIKE ? OR CAST(year AS TEXT) LIKE ?
       ORDER BY (status = 'sold'), id DESC LIMIT ?`,
    )
    .all(like, like, like, like, like, like, `${term}%`, limit) as (Row & { photo: string | null })[];
  const lower = term.toLowerCase();
  return rows.map((r) => {
    let field: Suggestion["field"] = "model";
    let match = `${r.brand} ${r.model}`.trim() || r.title;
    if (r.vin && r.vin.toLowerCase().includes(lower)) (field = "vin"), (match = r.vin);
    else if (r.serial && r.serial.toLowerCase().includes(lower)) (field = "serial"), (match = r.serial);
    else if (r.engine_code && r.engine_code.toLowerCase().includes(lower)) (field = "engine_code"), (match = r.engine_code);
    else if (r.year && String(r.year).startsWith(term)) (field = "year"), (match = String(r.year));
    return { id: r.id, slug: r.slug, title: r.title, type: r.type, match, field, photo: r.photo ?? undefined, status: r.status };
  });
}

const COLUMNS = [
  "type", "category", "title", "brand", "model", "year", "first_registration", "vin", "serial", "engine_code",
  "displacement", "transmission", "mileage", "fuel", "notes", "status",
] as const;

export function createItem(input: ItemInput, photos: string[] = []): number {
  const db = getDb();
  const tx = db.transaction(() => {
    const res = db
      .prepare(`INSERT INTO items (${COLUMNS.join(",")}, slug) VALUES (${COLUMNS.map(() => "?").join(",")}, ?)`)
      .run(...COLUMNS.map((c) => input[c] ?? null), slugify(input.title));
    const id = Number(res.lastInsertRowid);
    setPhotos(id, photos);
    return id;
  });
  return tx();
}

export function updateItem(id: number, input: ItemInput, photos?: string[]) {
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `UPDATE items SET ${COLUMNS.map((c) => `${c} = ?`).join(", ")}, slug = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(...COLUMNS.map((c) => input[c] ?? null), slugify(input.title), id);
    if (photos) setPhotos(id, photos);
  })();
}

export function setPhotos(itemId: number, filenames: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM photos WHERE item_id = ?").run(itemId);
  const ins = db.prepare("INSERT INTO photos (item_id, filename, position) VALUES (?, ?, ?)");
  filenames.slice(0, 8).forEach((f, i) => ins.run(itemId, f, i));
}

export function setStatus(id: number, status: Item["status"]) {
  getDb().prepare("UPDATE items SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export function deleteItem(id: number): string[] {
  const db = getDb();
  const files = (db.prepare("SELECT filename FROM photos WHERE item_id = ?").all(id) as { filename: string }[]).map(
    (r) => r.filename,
  );
  db.prepare("DELETE FROM items WHERE id = ?").run(id);
  return files;
}

export function isPhotoUsed(filename: string) {
  return !!getDb().prepare("SELECT 1 FROM photos WHERE filename = ? LIMIT 1").get(filename);
}
