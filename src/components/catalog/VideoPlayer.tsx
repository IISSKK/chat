"use client";

import { useState } from "react";
import { PlayIcon } from "@/components/icons";
import { useT } from "@/i18n/client";

/**
 * Видео объявления. Плеер (YouTube / Vimeo) подгружается только по нажатию — страница остаётся быстрой,
 * а YouTube не получает данных посетителя, пока он сам не запустит видео (youtube-nocookie).
 */
export function VideoPlayer({ embed, poster, title }: { embed: string; poster?: string; title: string }) {
  const t = useT();
  const [on, setOn] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-fg/90">
      {on ? (
        <iframe
          src={embed}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 grid place-items-center" aria-label={`${t.video.play}: ${title}`}>
          {poster && <img src={poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white/90 text-brand shadow-xl transition-transform duration-300 group-hover:scale-110 group-active:scale-95 sm:h-20 sm:w-20">
            <PlayIcon className="ml-1 h-7 w-7 sm:h-8 sm:w-8" />
          </span>
          <span className="absolute bottom-3 left-4 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-fg">{t.video.play}</span>
        </button>
      )}
    </div>
  );
}
