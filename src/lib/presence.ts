import "server-only";

/** Кто сейчас на сайте: посетители, приславшие «пульс» за последние 70 секунд (хранится в памяти процесса). */
const WINDOW_MS = 70_000;
const g = globalThis as unknown as { __presence?: Map<string, number> };
const seen = (g.__presence ??= new Map());

export function touchPresence(visitor: string) {
  seen.set(visitor, Date.now());
}

export function onlineCount() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [k, t] of seen) if (t < cutoff) seen.delete(k);
  return Math.max(seen.size, 0);
}
