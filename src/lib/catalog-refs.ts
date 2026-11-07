import "server-only";
import { getDb, transaction } from "./db";
import { slugify } from "./utils";

export interface GenerationRef {
  id: number;
  model_id: number;
  name: string;
  year_from: number;
  year_to: number;
}
export interface ModelRef {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  generations?: GenerationRef[];
}
export interface BrandRef {
  id: number;
  name: string;
  slug: string;
  models: ModelRef[];
}

const plain = <T extends object>(r: T): T => ({ ...r });

/** Приводим к аккуратному виду: лишние пробелы убираем, «hyundai» → «Hyundai» (если всё в одном регистре) */
export function normalizeName(raw: string): string {
  const s = raw.trim().replace(/\s+/g, " ").slice(0, 60);
  if (!s) return "";
  if (s === s.toLowerCase() || s === s.toUpperCase()) {
    return s.replace(/(^|[\s-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase()).replace(/(\p{L})(\p{L}*)/gu, (_, a: string, b: string) => a + (s === s.toUpperCase() && s.length > 4 ? b.toLowerCase() : b));
  }
  return s;
}

function uniqueSlug(table: "brands" | "models", base: string, brandId?: number) {
  const db = getDb();
  let slug = slugify(base) || "item";
  let n = 1;
  const exists = (sl: string) =>
    table === "brands"
      ? db.prepare("SELECT 1 FROM brands WHERE slug = ?").get(sl)
      : db.prepare("SELECT 1 FROM models WHERE brand_id = ? AND slug = ?").get(brandId!, sl);
  const root = slug;
  while (exists(slug)) slug = `${root}-${++n}`;
  return slug;
}

export function listBrands(): BrandRef[] {
  const db = getDb();
  const brands = (db.prepare("SELECT * FROM brands ORDER BY name COLLATE NOCASE").all() as unknown as BrandRef[]).map(plain);
  const models = (db.prepare("SELECT * FROM models ORDER BY name COLLATE NOCASE").all() as unknown as ModelRef[]).map(plain);
  const gens = (db.prepare("SELECT * FROM generations ORDER BY year_from, name").all() as unknown as GenerationRef[]).map(plain);
  const genBy = new Map<number, GenerationRef[]>();
  for (const g of gens) (genBy.get(g.model_id) ?? genBy.set(g.model_id, []).get(g.model_id)!).push(g);
  for (const m of models) m.generations = genBy.get(m.id) ?? [];
  const by = new Map<number, ModelRef[]>();
  for (const m of models) (by.get(m.brand_id) ?? by.set(m.brand_id, []).get(m.brand_id)!).push(m);
  return brands.map((b) => ({ ...b, models: by.get(b.id) ?? [] }));
}

export function findBrand(name: string): BrandRef | null {
  const r = getDb().prepare("SELECT * FROM brands WHERE name = ? COLLATE NOCASE").get(name.trim()) as unknown as BrandRef | undefined;
  return r ? { ...r, models: [] } : null;
}

export function createBrand(name: string): { brand?: BrandRef; error?: string } {
  const n = normalizeName(name);
  if (n.length < 2) return { error: "Название марки слишком короткое" };
  if (findBrand(n)) return { error: `Марка «${n}» уже есть в списке` };
  const slug = uniqueSlug("brands", n);
  const res = getDb().prepare("INSERT INTO brands (name, slug) VALUES (?, ?)").run(n, slug);
  return { brand: { id: Number(res.lastInsertRowid), name: n, slug, models: [] } };
}

export function createModel(brandId: number, name: string): { model?: ModelRef; error?: string } {
  const db = getDb();
  const n = normalizeName(name);
  if (!n) return { error: "Введите название модели" };
  if (!db.prepare("SELECT 1 FROM brands WHERE id = ?").get(brandId)) return { error: "Марка не найдена" };
  if (db.prepare("SELECT 1 FROM models WHERE brand_id = ? AND name = ? COLLATE NOCASE").get(brandId, n)) return { error: `Модель «${n}» уже есть у этой марки` };
  const slug = uniqueSlug("models", n, brandId);
  const res = db.prepare("INSERT INTO models (brand_id, name, slug) VALUES (?, ?, ?)").run(brandId, n, slug);
  return { model: { id: Number(res.lastInsertRowid), brand_id: brandId, name: n, slug } };
}

/** Переименование. Названия в объявлениях обновляются сразу вместе со справочником. */
export function renameBrand(id: number, name: string): string | null {
  const db = getDb();
  const n = normalizeName(name);
  if (n.length < 2) return "Название слишком короткое";
  const cur = db.prepare("SELECT name FROM brands WHERE id = ?").get(id) as { name: string } | undefined;
  if (!cur) return "Не найдено";
  const dup = db.prepare("SELECT id FROM brands WHERE name = ? COLLATE NOCASE AND id <> ?").get(n, id);
  if (dup) return `Марка «${n}» уже существует`;
  transaction(db, () => {
    db.prepare("UPDATE brands SET name = ? WHERE id = ?").run(n, id);
    db.prepare("UPDATE items SET brand = ? WHERE brand = ? COLLATE NOCASE").run(n, cur.name);
  });
  return null;
}

export function renameModel(id: number, name: string): string | null {
  const db = getDb();
  const n = normalizeName(name);
  if (!n) return "Введите название";
  const cur = db.prepare("SELECT m.name, m.brand_id, b.name AS brand FROM models m JOIN brands b ON b.id = m.brand_id WHERE m.id = ?").get(id) as { name: string; brand_id: number; brand: string } | undefined;
  if (!cur) return "Не найдено";
  if (db.prepare("SELECT 1 FROM models WHERE brand_id = ? AND name = ? COLLATE NOCASE AND id <> ?").get(cur.brand_id, n, id)) return `Модель «${n}» уже существует`;
  transaction(db, () => {
    db.prepare("UPDATE models SET name = ? WHERE id = ?").run(n, id);
    db.prepare("UPDATE items SET model = ? WHERE brand = ? COLLATE NOCASE AND model = ? COLLATE NOCASE AND type = 'car'").run(n, cur.brand, cur.name);
  });
  return null;
}

/** Сколько объявлений (включая корзину и черновики) используют марку/модель */
export function brandUsage(id: number) {
  const b = getDb().prepare("SELECT name FROM brands WHERE id = ?").get(id) as { name: string } | undefined;
  return b ? (getDb().prepare("SELECT COUNT(*) AS n FROM items WHERE brand = ? COLLATE NOCASE").get(b.name) as { n: number }).n : 0;
}
export function modelUsage(id: number) {
  const m = getDb().prepare("SELECT m.name, b.name AS brand FROM models m JOIN brands b ON b.id = m.brand_id WHERE m.id = ?").get(id) as { name: string; brand: string } | undefined;
  return m ? (getDb().prepare("SELECT COUNT(*) AS n FROM items WHERE brand = ? COLLATE NOCASE AND model = ? COLLATE NOCASE").get(m.brand, m.name) as { n: number }).n : 0;
}

export function deleteBrand(id: number): string | null {
  if (brandUsage(id) > 0) return "Есть объявления с этой маркой — сначала измените их";
  getDb().prepare("DELETE FROM brands WHERE id = ?").run(id);
  return null;
}
export function deleteModel(id: number): string | null {
  if (modelUsage(id) > 0) return "Есть объявления с этой моделью — сначала измените их";
  getDb().prepare("DELETE FROM models WHERE id = ?").run(id);
  return null;
}

/** Проверка марки и модели при сохранении объявления. Возвращает текст ошибки или null. Приводит регистр к справочнику. */
export function validateBrandModel(type: string, input: { brand: string; model: string }): string | null {
  const db = getDb();
  if (!input.brand) {
    if (input.model && type === "car") return "Сначала выберите марку";
    return null;
  }
  const brand = db.prepare("SELECT id, name FROM brands WHERE name = ? COLLATE NOCASE").get(input.brand) as { id: number; name: string } | undefined;
  if (!brand) return `Марки «${input.brand}» нет в справочнике. Выберите из списка или добавьте её кнопкой «＋».`;
  input.brand = brand.name;
  if (type === "car" && input.model) {
    const model = db.prepare("SELECT name FROM models WHERE brand_id = ? AND name = ? COLLATE NOCASE").get(brand.id, input.model) as { name: string } | undefined;
    if (!model) return `Модели «${input.model}» у марки ${brand.name} нет в справочнике. Выберите из списка или добавьте её кнопкой «＋».`;
    input.model = model.name;
  }
  return null;
}

/** Подтягивает в справочник марки и модели уже существующих автомобилей (после обновления). */
export function importFromItems() {
  const db = getDb();
  const rows = db.prepare("SELECT DISTINCT brand, model FROM items WHERE type = 'car' AND brand <> ''").all() as { brand: string; model: string }[];
  const engBrands = db.prepare("SELECT DISTINCT brand FROM items WHERE type = 'engine' AND brand <> ''").all() as { brand: string }[];
  transaction(db, () => {
    for (const { brand } of engBrands) if (!findBrand(brand)) createBrand(brand);
    for (const r of rows) {
      let b = findBrand(r.brand);
      if (!b) b = createBrand(r.brand).brand ?? null;
      if (b && r.model) createModel(b.id, r.model);
    }
  });
}

/** Для публичных страниц марок */
export function getBrandBySlug(slug: string): BrandRef | null {
  const db = getDb();
  const b = db.prepare("SELECT * FROM brands WHERE slug = ?").get(slug) as unknown as BrandRef | undefined;
  if (!b) return null;
  const models = (db.prepare("SELECT * FROM models WHERE brand_id = ? ORDER BY name COLLATE NOCASE").all(b.id) as unknown as ModelRef[]).map(plain);
  return { ...plain(b), models };
}

/** Марки и модели, у которых есть опубликованные автомобили (для страниц, меню и sitemap) */
export function publicBrandIndex(): { brand: BrandRef; count: number; models: { model: ModelRef; count: number }[] }[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT brand, model, COUNT(*) AS n FROM items
       WHERE type = 'car' AND deleted_at IS NULL AND status <> 'draft' AND brand <> '' GROUP BY brand COLLATE NOCASE, model COLLATE NOCASE`,
    )
    .all() as { brand: string; model: string; n: number }[];
  const out = new Map<string, { brand: BrandRef; count: number; models: { model: ModelRef; count: number }[] }>();
  const all = listBrands();
  for (const r of rows) {
    const b = all.find((x) => x.name.toLowerCase() === r.brand.toLowerCase());
    if (!b) continue;
    const entry = out.get(b.slug) ?? { brand: b, count: 0, models: [] };
    entry.count += r.n;
    const m = b.models.find((x) => x.name.toLowerCase() === r.model.toLowerCase());
    if (m) entry.models.push({ model: m, count: r.n });
    out.set(b.slug, entry);
  }
  return [...out.values()].sort((a, b) => b.count - a.count);
}

/** Адреса страниц марки и модели для объявления (если они есть в справочнике) */
export function brandModelSlugs(brand: string, model: string): { brand?: { name: string; slug: string }; model?: { name: string; slug: string } } {
  if (!brand) return {};
  const db = getDb();
  const b = db.prepare("SELECT id, name, slug FROM brands WHERE name = ? COLLATE NOCASE").get(brand) as { id: number; name: string; slug: string } | undefined;
  if (!b) return {};
  const m = model ? (db.prepare("SELECT name, slug FROM models WHERE brand_id = ? AND name = ? COLLATE NOCASE").get(b.id, model) as { name: string; slug: string } | undefined) : undefined;
  return { brand: { name: b.name, slug: b.slug }, model: m ? { name: m.name, slug: m.slug } : undefined };
}

const MIN_YEAR = 1950;

function checkGeneration(name: string, from: number, to: number): { name?: string; error?: string } {
  const n = name.trim().replace(/\s+/g, " ").slice(0, 30);
  const max = new Date().getFullYear() + 1;
  if (!n) return { error: "Введите название поколения, например DN8" };
  if (![from, to].every((y) => Number.isInteger(y) && y >= MIN_YEAR && y <= max)) return { error: `Годы должны быть от ${MIN_YEAR} до ${max}` };
  if (from > to) return { error: "Год «от» не может быть больше года «до»" };
  return { name: n };
}

export function createGeneration(modelId: number, name: string, from: number, to: number): { error?: string } {
  const db = getDb();
  const c = checkGeneration(name, from, to);
  if (!c.name) return { error: c.error };
  if (!db.prepare("SELECT 1 FROM models WHERE id = ?").get(modelId)) return { error: "Модель не найдена" };
  if (db.prepare("SELECT 1 FROM generations WHERE model_id = ? AND name = ? COLLATE NOCASE").get(modelId, c.name)) return { error: `Поколение «${c.name}» уже есть у этой модели` };
  db.prepare("INSERT INTO generations (model_id, name, year_from, year_to) VALUES (?, ?, ?, ?)").run(modelId, c.name, from, to);
  return {};
}

export function updateGeneration(id: number, name: string, from: number, to: number): string | null {
  const db = getDb();
  const cur = db.prepare("SELECT model_id FROM generations WHERE id = ?").get(id) as { model_id: number } | undefined;
  if (!cur) return "Поколение не найдено";
  const c = checkGeneration(name, from, to);
  if (!c.name) return c.error ?? "Ошибка";
  if (db.prepare("SELECT 1 FROM generations WHERE model_id = ? AND name = ? COLLATE NOCASE AND id <> ?").get(cur.model_id, c.name, id)) return `Поколение «${c.name}» уже есть у этой модели`;
  db.prepare("UPDATE generations SET name = ?, year_from = ?, year_to = ? WHERE id = ?").run(c.name, from, to, id);
  return null;
}

export function deleteGeneration(id: number) {
  getDb().prepare("DELETE FROM generations WHERE id = ?").run(id);
}

export interface GenerationInfo extends GenerationRef {
  brand: string;
  model: string;
}

export function getGeneration(id: number): GenerationInfo | null {
  const r = getDb()
    .prepare("SELECT g.*, m.name AS model, b.name AS brand FROM generations g JOIN models m ON m.id = g.model_id JOIN brands b ON b.id = m.brand_id WHERE g.id = ?")
    .get(id) as unknown as GenerationInfo | undefined;
  return r ? { ...r } : null;
}

/** Поколения выбранной модели (для фильтра на сайте) */
export function generationsOf(brand: string, model: string): GenerationRef[] {
  return (getDb()
    .prepare("SELECT g.* FROM generations g JOIN models m ON m.id = g.model_id JOIN brands b ON b.id = m.brand_id WHERE b.name = ? COLLATE NOCASE AND m.name = ? COLLATE NOCASE ORDER BY g.year_from, g.name")
    .all(brand, model) as unknown as GenerationRef[]).map(plain);
}

/** К какому поколению относится авто: подходящее по году, а при пересечении — с самым узким диапазоном */
export function generationFor(brand: string, model: string, year: number | null): GenerationRef | null {
  if (!year) return null;
  const hit = generationsOf(brand, model).filter((g) => year >= g.year_from && year <= g.year_to);
  return hit.sort((a, b) => a.year_to - a.year_from - (b.year_to - b.year_from))[0] ?? null;
}
