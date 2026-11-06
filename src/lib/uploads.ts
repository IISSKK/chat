import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { UPLOAD_DIR } from "./db";
import { isPhotoUsed } from "./items";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 15 * 1024 * 1024;

/** Сохраняет загруженное фото: уменьшает до 1600px и сжимает в JPEG (через sharp) — JPEG лучше всего
 * поддерживается превью ссылок в WhatsApp/Telegram/Facebook. */
export async function saveUpload(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error(`Неподдерживаемый формат: ${file.type || file.name}`);
  if (file.size > MAX_BYTES) throw new Error(`Файл слишком большой: ${file.name}`);
  const buf = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomBytes(12).toString("hex");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  try {
    const sharp = (await import("sharp")).default;
    const base = sharp(buf).rotate().flatten({ background: "#ffffff" });
    const [full, small] = await Promise.all([
      base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
      base.clone().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toBuffer(),
    ]);
    const name = `${id}.jpg`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), full);
    await fs.writeFile(path.join(UPLOAD_DIR, `${id}_sm.jpg`), small); // уменьшенная копия для списков
    return name;
  } catch {
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const name = `${id}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    return name;
  }
}

export async function removeUploads(filenames: string[]) {
  for (const f of filenames) {
    if (f.startsWith("demo/") || f.includes("/") || f.includes("..")) continue;
    if (isPhotoUsed(f)) continue;
    await fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => {});
    await fs.unlink(path.join(UPLOAD_DIR, f.replace(/\.(\w+)$/, "_sm.$1"))).catch(() => {});
  }
}

export function safeUploadPath(name: string) {
  if (!/^[a-f0-9]{24}(_sm)?\.(webp|jpg|png|avif|gif)$/.test(name)) return null;
  return path.join(UPLOAD_DIR, name);
}
