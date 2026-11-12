import fs from "node:fs/promises";
import { MD_WIDTH, safeUploadPath } from "@/lib/uploads";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png", avif: "image/avif", gif: "image/gif" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  const p = safeUploadPath(file.join("/"));
  if (!p) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(p).catch(async (e) => {
      // Старые загрузки без уменьшенных копий: «sm» заменяем оригиналом, а «md» (1000 px) делаем из оригинала один раз и сохраняем
      if (p.includes("_md.")) {
        const src = await fs.readFile(p.replace("_md.", "."));
        const sharp = (await import("sharp")).default;
        const out = await sharp(src, { limitInputPixels: 100_000_000 }).resize({ width: MD_WIDTH, height: MD_WIDTH, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
        await fs.writeFile(p, out).catch(() => {});
        return out;
      }
      if (p.includes("_sm.")) return fs.readFile(p.replace("_sm.", "."));
      throw e;
    });
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[p.split(".").pop()!] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
