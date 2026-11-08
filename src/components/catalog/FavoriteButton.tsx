"use client";

import { HeartIcon } from "@/components/icons";
import { useT } from "@/i18n/client";
import { useFavorites } from "@/lib/favorites-client";

/** Сердечко «В избранное» (хранится в браузере) */
export function FavoriteButton({ id, className = "", withLabel = false }: { id: number; className?: string; withLabel?: boolean }) {
  const t = useT();
  const { has, toggle } = useFavorites();
  const on = has(id);
  const label = on ? t.fav.remove : t.fav.add;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`press grid place-items-center rounded-full transition-colors ${withLabel ? "h-auto gap-2 px-4 py-3 text-sm font-semibold sm:grid-flow-col" : "h-11 w-11"} ${
        on ? "bg-flame/15 text-flame" : "bg-white/85 text-fg/80 hover:text-flame"
      } shadow-sm ${className}`}
    >
      <HeartIcon className={`h-[18px] w-[18px] transition-transform duration-300 ${on ? "scale-110" : ""}`} fill={on ? "currentColor" : "none"} />
      {withLabel && <span>{label}</span>}
    </button>
  );
}
