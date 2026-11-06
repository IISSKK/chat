import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export function Pagination({
  page,
  pages,
  basePath,
  params,
}: {
  page: number;
  pages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }

  const base = "grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-bold transition-all";
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${base} bg-white/[0.06] hover:bg-white/[0.12]`} aria-label="Назад"><ChevronLeft className="h-4 w-4" /></Link>
      ) : (
        <span className={`${base} bg-white/[0.03] text-white/20`}><ChevronLeft className="h-4 w-4" /></span>
      )}
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-white/40">…</span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "bg-brand text-ink shadow-[0_6px_24px_-6px_rgb(var(--c-brand)/0.55)]" : "bg-white/[0.06] hover:bg-white/[0.12]"}`}
          >
            {n}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link href={href(page + 1)} className={`${base} bg-white/[0.06] hover:bg-white/[0.12]`} aria-label="Вперёд"><ChevronRight className="h-4 w-4" /></Link>
      ) : (
        <span className={`${base} bg-white/[0.03] text-white/20`}><ChevronRight className="h-4 w-4" /></span>
      )}
    </nav>
  );
}
