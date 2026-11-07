import "server-only";
import { siteConfig } from "@/config/site";
import { getDb } from "./db";

/** Номер WhatsApp, который владелец задаёт в админке (раздел «Контакты»). */
export interface WaContact {
  /** Подпись для посетителя: «Отдел продаж», «Документы и таможня», имя менеджера… */
  name: string;
  /** Как показывать номер: +82 10-1234-5678 */
  phone: string;
  /** Только цифры для ссылки wa.me: 821012345678 */
  digits: string;
  /** Языки менеджера (необязательно): «RU, EN» */
  langs: string;
}

export const MAX_WA_CONTACTS = 10;
const KEY = "whatsapp_contacts";

export function normalizeDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

/** Номера из настроек; если ещё не заданы — номер из .env / site.ts */
export function getWhatsAppContacts(): WaContact[] {
  try {
    const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(KEY) as { value: string } | undefined;
    if (row) {
      const list = JSON.parse(row.value) as WaContact[];
      if (Array.isArray(list) && list.length) return list;
    }
  } catch {}
  return [{ name: "", phone: siteConfig.whatsappDisplay, digits: normalizeDigits(siteConfig.whatsapp), langs: "" }];
}

/** Проверка и сохранение. Возвращает текст ошибки или null. */
export function saveWhatsAppContacts(input: unknown): string | null {
  if (!Array.isArray(input) || !input.length) return "Нужен хотя бы один номер";
  if (input.length > MAX_WA_CONTACTS) return `Максимум ${MAX_WA_CONTACTS} номеров`;
  const list: WaContact[] = [];
  for (const raw of input) {
    const r = (raw ?? {}) as Partial<WaContact>;
    const phone = String(r.phone ?? "").trim().slice(0, 32);
    const digits = normalizeDigits(phone);
    if (digits.length < 8 || digits.length > 15) return `Неверный номер «${phone || "пусто"}»: укажите в международном формате, например +82 10 1234 5678`;
    if (list.some((c) => c.digits === digits)) return `Номер ${phone} указан дважды`;
    list.push({ name: String(r.name ?? "").trim().slice(0, 60), phone, digits, langs: String(r.langs ?? "").trim().slice(0, 30) });
  }
  getDb()
    .prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .run(KEY, JSON.stringify(list));
  return null;
}

export type WaKind = "price" | "docs" | "generic" | "partner" | "body" | "chassis";

/** Варианты для кнопки WhatsApp: по одному на каждый номер (короткие ссылки /api/wa, язык передаётся параметром l). */
export function waOptions(kind: WaKind, itemId?: number, locale = "ru") {
  return getWhatsAppContacts().map((c, n) => ({
    name: c.name,
    phone: c.phone,
    langs: c.langs,
    href: `/api/wa?kind=${kind}${itemId ? `&id=${itemId}` : ""}&n=${n}&l=${locale}`,
  }));
}
export type WaOption = ReturnType<typeof waOptions>[number];
