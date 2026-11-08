import "server-only";
import { BODIES, CATEGORIES, FUELS, ITEM_TYPES, MAX_PHOTOS, STATUSES, TRANSMISSIONS, type ItemInput } from "./types";
import { saveUpload } from "./uploads";
import { parseVideoUrl } from "./video";
import { validateBrandModel } from "./catalog-refs";

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const int = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(/[\s,]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};
const oneOf = <T extends string>(v: string, list: readonly T[], def: T | "" = ""): T | "" =>
  (list as readonly string[]).includes(v) ? (v as T) : def;

export function parseItemInput(fd: FormData): { data?: ItemInput; error?: string } {
  const type = oneOf(str(fd, "type"), ITEM_TYPES);
  if (!type) return { error: "Неизвестный тип товара" };
  const title = str(fd, "title");
  if (!title) return { error: "Укажите название" };
  const year = int(fd, "year");
  if (year !== null && (year < 1950 || year > 2100)) return { error: "Некорректный год" };
  const videoRaw = str(fd, "video_url", 300);
  const video = parseVideoUrl(videoRaw);
  if (videoRaw && !video) return { error: "Ссылка на видео не распознана. Подойдёт ссылка с YouTube или Vimeo." };
  const brandModel = { brand: str(fd, "brand", 60), model: str(fd, "model", 80) };
  const refError = validateBrandModel(type, brandModel);
  if (refError) return { error: refError };
  return {
    data: {
      type,
      category: oneOf(str(fd, "category"), CATEGORIES, "listing") || "listing",
      title,
      brand: brandModel.brand,
      model: brandModel.model,
      year,
      first_registration: str(fd, "first_registration", 20),
      vin: str(fd, "vin", 40).toUpperCase(),
      serial: str(fd, "serial", 60).toUpperCase(),
      engine_code: str(fd, "engine_code", 40).toUpperCase(),
      displacement: int(fd, "displacement"),
      transmission: oneOf(str(fd, "transmission"), TRANSMISSIONS),
      mileage: int(fd, "mileage"),
      fuel: oneOf(str(fd, "fuel"), FUELS),
      body: type === "car" ? oneOf(str(fd, "body"), BODIES) : "",
      notes: str(fd, "notes", 5000),
      status: oneOf(str(fd, "status"), STATUSES, "draft") || "draft",
      video_url: video?.url ?? "",
    },
  };
}

type OrderEntry = { kind: "existing"; filename: string } | { kind: "new"; index: number };

/** Собирает итоговый упорядоченный список фото: существующие (в новом порядке) + новые загрузки. */
export async function resolvePhotos(fd: FormData, existing: string[]): Promise<string[]> {
  const files = fd.getAll("newPhotos").filter((f): f is File => f instanceof File && f.size > 0);
  let order: OrderEntry[] = [];
  try {
    order = JSON.parse(String(fd.get("photoOrder") || "[]"));
  } catch {}
  if (!Array.isArray(order) || !order.length) order = files.map((_, index) => ({ kind: "new" as const, index }));
  const result: string[] = [];
  for (const entry of order.slice(0, MAX_PHOTOS)) {
    if (entry.kind === "existing" && existing.includes(entry.filename)) result.push(entry.filename);
    else if (entry.kind === "new" && files[entry.index]) result.push(await saveUpload(files[entry.index]));
  }
  return result;
}
