"use client";

import { useSyncExternalStore } from "react";

/** Избранное хранится в браузере (localStorage) — регистрация не нужна. До 50 позиций. */
const KEY = "bk-fav";
export const MAX_FAVORITES = 50;
const EMPTY: number[] = [];

let cache: number[] | null = null;
const listeners = new Set<() => void>();

function read(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX_FAVORITES) : [];
  } catch {
    return [];
  }
}

function snapshot(): number[] {
  return (cache ??= read());
}

function emit(next: number[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function toggleFavorite(id: number) {
  const cur = snapshot();
  if (cur.includes(id)) return emit(cur.filter((x) => x !== id));
  emit([id, ...cur].slice(0, MAX_FAVORITES));
  // для аналитики: сколько раз добавляют в избранное (без идентификаторов посетителя)
  try {
    navigator.sendBeacon?.("/api/favorites", new Blob([JSON.stringify({ id })], { type: "application/json" }));
  } catch {}
}

export function clearFavorites() {
  emit([]);
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  return { ids, has: (id: number) => ids.includes(id), toggle: toggleFavorite, count: ids.length };
}
