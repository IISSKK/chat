import "server-only";
import { getDb, transaction } from "./db";
import { slugify } from "./utils";
import type { Item, ItemFilters, ItemInput, Photo } from "./types";
import { applyTranslations } from "./item-i18n";
import { generationFor } from "./catalog-refs";
import type { Locale } from "@/i18n/config";

type Row = Omit<Item, "photos">;

function attachPhotos(rows: Row[]): Item[] {
  if (!rows.length) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const photos = db
    .prepare(`SELECT * FROM photos WHERE item_id IN (${ids.map(() => "?").join(",")}) ORDER BY position, id`)
    .all(...ids) as unknown as Photo[];
  const byItem = new Map<number, Photo[]>();
  for (const p of photos) {
    const list = byItem.get(p.item_id) ?? [];
    list.push({ ...p }); // node:sqlite возвращает объекты без прототипа — делаем обычные
    byItem.set(p.item_id, list);
  }
  return rows.map((r) => ({ ...r, photos: byItem.get(r.id) ?? [] }));
}

/** Экранирует % и _ в пользовательском поиске (иначе они работают как шаблоны LIKE) */
const likeEsc = (s: string) => s.replace(/[\\%_]/g, "\\$&");

function buildWhere(f: ItemFilters) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  // Корзина и черновики никогда не попадают на сайт: только если админка явно просит
  where.push(f.trash ? "deleted_at IS NOT NULL" : "deleted_at IS NULL");
  if (!f.includeDrafts) where.push("status <> 'draft'");
  if (f.type) (where.push("type = ?"), params.push(f.type));
  if (f.category) (where.push("category = ?"), params.push(f.category));
  if (f.status) (where.push("status = ?"), params.push(f.status));
  if (f.brand) (where.push("brand = ? COLLATE NOCASE"), params.push(f.brand));
  if (f.model) (where.push("model = ? COLLATE NOCASE"), params.push(f.model));
  if (f.year) (where.push("year = ?"), params.push(f.year));
  if (f.yearFrom) (where.push("year >= ?"), params.push(f.yearFrom));
  if (f.yearTo) (where.push("year <= ?"), params.push(f.yearTo));
  if (f.fuel) (where.push("fuel = ?"), params.push(f.fuel));
  if (f.transmission) (where.push("transmission = ?"), params.push(f.transmission));
  if (f.q && f.q.trim()) {
    const terms = f.q.trim().split(/\s+/).slice(0, 6);
    for (const term of terms) {
      const like = `%${likeEsc(term)}%`;
      where.push(
        `(title LIKE ? ESCAPE '\\' OR brand LIKE ? ESCAPE '\\' OR model LIKE ? ESCAPE '\\' OR vin LIKE ? ESCAPE '\\' OR serial LIKE ? ESCAPE '\\' OR engine_code LIKE ? ESCAPE '\\' OR CAST(year AS TEXT) = ?
          OR EXISTS (SELECT 1 FROM item_translations tr WHERE tr.item_id = items.id AND tr.title LIKE ? ESCAPE '\\')
          OR EXISTS (SELECT 1 FROM generations g JOIN models gm ON gm.id = g.model_id JOIN brands gb ON gb.id = gm.brand_id WHERE g.name LIKE ? ESCAPE '\\' AND gb.name = items.brand COLLATE NOCASE AND gm.name = items.model COLLATE NOCASE AND items.year BETWEEN g.year_from AND g.year_to))`,
      );
      params.push(like, like, like, like, like, like, term, like, like);
    }
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export function listItems(f: ItemFilters, page = 1, perPage = 12, locale?: Locale) {
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
  const items = attachPhotos(rows);
  return { items: locale ? applyTranslations(items, locale) : items, total, page: current, pages };
}

/** Объявление для сайта: без черновиков и корзины */
export function getItem(id: number, locale?: Locale): Item | null {
  const row = getDb().prepare("SELECT * FROM items WHERE id = ? AND deleted_at IS NULL AND status <> 'draft'").get(id) as Row | undefined;
  if (!row) return null;
  const item = attachPhotos([row])[0];
  return locale ? applyTranslations([item], locale)[0] : item;
}

/** Самое новое (последнее добавленное) опубликованное объявление в наличии, у которого есть фото. Из него берутся витрина и обложки на главной. */
export function latestItem(type: "car" | "engine", locale?: Locale): Item | null {
  const row = getDb()
    .prepare("SELECT id FROM items WHERE type = ? AND status = 'available' AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM photos WHERE item_id = items.id) ORDER BY id DESC LIMIT 1")
    .get(type) as { id: number } | undefined;
  return row ? getItem(row.id, locale) : null;
}

/** Любое объявление (для админки и предпросмотра черновика): включая черновики и корзину */
export function getItemAny(id: number, locale?: Locale): Item | null {
  const row = getDb().prepare("SELECT * FROM items WHERE id = ?").get(id) as Row | undefined;
  if (!row) return null;
  const item = attachPhotos([row])[0];
  return locale ? applyTranslations([item], locale)[0] : item;
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
  const models = (
    f.brand
      ? db.prepare(`SELECT DISTINCT model FROM items ${and} brand = ? COLLATE NOCASE AND model <> '' ORDER BY model COLLATE NOCASE`).all(...params, f.brand)
      : db.prepare(`SELECT DISTINCT model FROM items ${and} model <> '' ${f.type === "engine" ? "AND 0" : ""} ORDER BY model COLLATE NOCASE`).all(...params)
  ).map((r) => (r as { model: string }).model);
  return { brands, years, models };
}

export interface Suggestion {
  id: number;
  slug: string;
  title: string;
  type: Item["type"];
  match: string;
  field: "vin" | "serial" | "model" | "year" | "engine_code" | "generation";
  photo?: string;
  status: Item["status"];
}

export function suggest(q: string, limit = 8): Suggestion[] {
  const term = q.trim();
  if (term.length < 2) return [];
  const like = `%${likeEsc(term)}%`;
  const rows = getDb()
    .prepare(
      `SELECT i.*, (SELECT filename FROM photos p WHERE p.item_id = i.id ORDER BY position LIMIT 1) AS photo
       FROM items i
       WHERE deleted_at IS NULL AND status <> 'draft' AND (
         vin LIKE ?1 ESCAPE '\\' OR serial LIKE ?1 ESCAPE '\\' OR title LIKE ?1 ESCAPE '\\' OR model LIKE ?1 ESCAPE '\\'
         OR brand LIKE ?1 ESCAPE '\\' OR engine_code LIKE ?1 ESCAPE '\\' OR CAST(year AS TEXT) LIKE ?2 ESCAPE '\\'
         OR EXISTS (SELECT 1 FROM item_translations tr WHERE tr.item_id = i.id AND tr.title LIKE ?1 ESCAPE '\\')
         OR EXISTS (SELECT 1 FROM generations g JOIN models gm ON gm.id = g.model_id JOIN brands gb ON gb.id = gm.brand_id WHERE g.name LIKE ?1 ESCAPE '\\' AND gb.name = i.brand COLLATE NOCASE AND gm.name = i.model COLLATE NOCASE AND i.year BETWEEN g.year_from AND g.year_to))
       ORDER BY (status = 'sold'), id DESC LIMIT ?3`,
    )
    .all(like, `${likeEsc(term)}%`, limit) as (Row & { photo: string | null })[];
  const lower = term.toLowerCase();
  return rows.map((r) => {
    let field: Suggestion["field"] = "model";
    let match = `${r.brand} ${r.model}`.trim() || r.title;
    if (r.vin && r.vin.toLowerCase().includes(lower)) (field = "vin"), (match = r.vin);
    else if (r.serial && r.serial.toLowerCase().includes(lower)) (field = "serial"), (match = r.serial);
    else if (r.engine_code && r.engine_code.toLowerCase().includes(lower)) (field = "engine_code"), (match = r.engine_code);
    else if (r.year && String(r.year).startsWith(term)) (field = "year"), (match = String(r.year));
    else if (![r.title, r.brand, r.model].some((v) => v?.toLowerCase().includes(lower))) {
      const g = generationFor(r.brand, r.model, r.year);
      if (g && g.name.toLowerCase().includes(lower)) (field = "generation"), (match = `${r.brand} ${r.model} ${g.name}`);
    }
    return { id: r.id, slug: r.slug, title: r.title, type: r.type, match, field, photo: r.photo ?? undefined, status: r.status };
  });
}

const COLUMNS = [
  "type", "category", "title", "brand", "model", "year", "first_registration", "vin", "serial", "engine_code",
  "displacement", "transmission", "mileage", "fuel", "notes", "status", "video_url",
] as const;

export function createItem(input: ItemInput, photos: string[] = []): number {
  const db = getDb();
  return transaction(db, () => {
    const res = db
      .prepare(`INSERT INTO items (${COLUMNS.join(",")}, slug) VALUES (${COLUMNS.map(() => "?").join(",")}, ?)`)
      .run(...COLUMNS.map((c) => input[c] ?? null), slugify(input.title));
    const id = Number(res.lastInsertRowid);
    setPhotos(id, photos);
    return id;
  });
}

export function updateItem(id: number, input: ItemInput, photos?: string[]) {
  const db = getDb();
  transaction(db, () => {
    db.prepare(
      `UPDATE items SET ${COLUMNS.map((c) => `${c} = ?`).join(", ")}, slug = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(...COLUMNS.map((c) => input[c] ?? null), slugify(input.title), id);
    if (photos) setPhotos(id, photos);
  });
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

/** «Удалить» = в корзину (можно восстановить 30 дней) */
export function trashItem(id: number) {
  getDb().prepare("UPDATE items SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(id);
}

export function restoreItem(id: number) {
  getDb().prepare("UPDATE items SET deleted_at = NULL, status = CASE WHEN status = 'draft' THEN 'draft' ELSE status END, updated_at = datetime('now') WHERE id = ?").run(id);
}

/** Окончательно удаляет объявления, пролежавшие в корзине дольше days дней. Возвращает файлы фото для удаления с диска. */
export function purgeOldTrash(days = 30): string[] {
  const db = getDb();
  const ids = (db.prepare("SELECT id FROM items WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', ?)").all(`-${days} days`) as { id: number }[]).map((r) => r.id);
  const files: string[] = [];
  for (const id of ids) files.push(...deleteItem(id));
  return files;
}

/** Окончательное удаление (из корзины) */
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

/** Учитывает просмотр объявления уникальным посетителем. Возвращает актуальное число просмотров. */
export function recordItemView(itemId: number, visitor: string): number {
  const db = getDb();
  const res = db.prepare("INSERT OR IGNORE INTO item_views (item_id, visitor) VALUES (?, ?)").run(itemId, visitor);
  if (res.changes) db.prepare("UPDATE items SET views = views + 1 WHERE id = ?").run(itemId);
  const row = db.prepare("SELECT views FROM items WHERE id = ?").get(itemId) as { views: number } | undefined;
  return row?.views ?? 0;
}
