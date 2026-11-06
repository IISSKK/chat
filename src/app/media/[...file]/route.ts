import fs from "node:fs/promises";
import { safeUploadPath } from "@/lib/uploads";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png", avif: "image/avif", gif: "image/gif" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  const p = safeUploadPath(file.join("/"));
  if (!p) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(p);
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
