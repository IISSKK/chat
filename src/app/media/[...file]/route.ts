import fs from "node:fs/promises";
import { safeUploadPath } from "@/lib/uploads";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png", avif: "image/avif", gif: "image/gif" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  const p = safeUploadPath(file.join("/"));
  if (!p) return new Response("Not found", { status: 404 });
  try {
    // Если уменьшенной копии нет (старые загрузки) — отдаём оригинал
    const data = await fs.readFile(p).catch((e) => (p.includes("_sm.") ? fs.readFile(p.replace("_sm.", ".")) : Promise.reject(e)));
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
