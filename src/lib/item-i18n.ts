import "server-only";
import crypto from "node:crypto";
import { getDb } from "./db";
import type { Locale } from "@/i18n/config";
import type { Item } from "./types";

export function sourceHash(item: Pick<Item, "title" | "notes">) {
  return crypto.createHash("sha1").update(`${item.title}\n${item.notes}`).digest("hex").slice(0, 16);
}

/** Подставляет перевод на язык посетителя, если он актуален (текст оригинала не менялся после перевода). */
export function applyTranslations<T extends Item>(items: T[], locale: Locale): T[] {
  if (!items.length) return items;
  const db = getDb();
  const ids = items.map((i) => i.id);
  const rows = db
    .prepare(`SELECT item_id, title, notes, src_hash FROM item_translations WHERE lang = ? AND item_id IN (${ids.map(() => "?").join(",")})`)
    .all(locale, ...ids) as { item_id: number; title: string; notes: string; src_hash: string }[];
  const by = new Map(rows.map((r) => [r.item_id, r]));
  return items.map((it) => {
    const tr = by.get(it.id);
    if (!tr || tr.src_hash !== sourceHash(it)) return it;
    return { ...it, title: tr.title || it.title, notes: it.notes ? tr.notes || it.notes : "" };
  });
}

