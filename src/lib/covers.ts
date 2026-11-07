import "server-only";
import { getSetting, setSetting, deleteSetting } from "./settings";
import { removeUploads } from "./uploads";

export type CoverKind = "car" | "engine";
const KEY: Record<CoverKind, string> = { car: "cover_car", engine: "cover_engine" };

export const isCoverKind = (v: unknown): v is CoverKind => v === "car" || v === "engine";

/** Имя загруженного файла обложки раздела на главной или null (тогда берётся фото свежего объявления) */
export function getCover(kind: CoverKind): string | null {
  const v = getSetting(KEY[kind]);
  return v && /^[a-f0-9]{24}\.jpg$/.test(v) ? v : null;
}

export async function setCover(kind: CoverKind, filename: string) {
  const old = getCover(kind);
  setSetting(KEY[kind], filename);
  if (old && old !== filename) await removeUploads([old]);
}

export async function clearCover(kind: CoverKind) {
  const old = getCover(kind);
  deleteSetting(KEY[kind]);
  if (old) await removeUploads([old]);
}
