import "server-only";
import { getDb } from "./db";
import { purgeOldTrash } from "./items";
import { removeUploads } from "./uploads";
import { pruneAudit } from "./audit";
import { pruneEvents } from "./events";
import { pruneLeads } from "./leads";
import { pruneRateLimits } from "./ratelimit";

/** Регулярная уборка: корзина (30 дней), журнал (180), события (400), заявки (2 года), счётчики лимитов. Запускается при старте и раз в 6 часов. */
export async function runMaintenance() {
  try {
    getDb();
    const files = purgeOldTrash(30);
    if (files.length) await removeUploads(files);
    pruneAudit();
    pruneEvents();
    pruneLeads();
    pruneRateLimits();
  } catch (e) {
    console.error("[maintenance]", e);
  }
}

let started = false;
export function startMaintenance() {
  if (started) return;
  started = true;
  void runMaintenance();
  setInterval(() => void runMaintenance(), 6 * 60 * 60 * 1000).unref?.();
}
