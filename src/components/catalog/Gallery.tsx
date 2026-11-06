"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CloseIcon } from "@/components/icons";

/** Галерея до 8 фото: свайп на телефоне, стрелки, миниатюры, полноэкранный просмотр. */
export function Gallery({ photos, title, sold }: { photos: string[]; title: string; sold?: boolean }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const n = photos.length;

  const go = useCallback(
    (i: number) => {
      const next = (i + n) % n;
      setIndex(next);
      const el = track.current;
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    },
    [n],
  );

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, index, go]);

  if (!n) {
    return <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-ink-700 text-white/40">Фото скоро</div>;
  }

  const arrow = "absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-white backdrop-blur-md transition hover:scale-110 hover:bg-ink/80 active:scale-95";

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-3xl bg-ink-700">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto no-scrollbar"
        >
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setZoom(true)}
              className="img-skeleton relative h-full w-full shrink-0 snap-center cursor-zoom-in"
              aria-label={`Фото ${i + 1}`}
            >
              <img
                src={src}
                alt={`${title} — фото ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className={`relative h-full w-full animate-fade-in object-cover ${sold ? "grayscale-[50%]" : ""}`}
              />
            </button>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} className={`${arrow} left-3 opacity-0 group-hover:opacity-100 max-md:opacity-100`} aria-label="Предыдущее фото">
              <ChevronLeft />
            </button>
            <button type="button" onClick={() => go(index + 1)} className={`${arrow} right-3 opacity-0 group-hover:opacity-100 max-md:opacity-100`} aria-label="Следующее фото">
              <ChevronRight />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {photos.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-brand" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
            <span className="absolute right-3 top-3 rounded-full bg-ink/60 px-2.5 py-1 text-xs font-bold backdrop-blur">
              {index + 1}/{n}
            </span>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => go(i)}
              className={`aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                i === index ? "scale-[1.03] border-brand" : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Показать фото ${i + 1}`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-ink/95 backdrop-blur-xl" onClick={() => setZoom(false)}>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-bold text-white/70">{index + 1} / {n}</span>
            <button className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Закрыть">
              <CloseIcon />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-2 pb-8" onClick={(e) => e.stopPropagation()}>
            <img key={index} src={photos[index]} alt={title} className="max-h-full max-w-full animate-fade-in rounded-2xl object-contain" />
            {n > 1 && (
              <>
                <button onClick={() => go(index - 1)} className={`${arrow} left-3`} aria-label="Предыдущее"><ChevronLeft /></button>
                <button onClick={() => go(index + 1)} className={`${arrow} right-3`} aria-label="Следующее"><ChevronRight /></button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
