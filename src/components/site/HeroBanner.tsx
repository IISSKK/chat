"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BANNER_INTERVAL, type BannerSlide } from "@/config/banners";
import { ArrowRight, ChevronLeft, ChevronRight, WhatsAppIcon } from "@/components/icons";

/** Полноэкранный баннер-слайдер: плавная смена, медленный наезд камеры, прогресс, свайп. Без 3D. */
export function HeroBanner({ slides, whatsappBase }: { slides: BannerSlide[]; whatsappBase: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0); // перезапуск анимации прогресса
  const touch = useRef<number | null>(null);
  const n = slides.length;

  const go = useCallback(
    (i: number) => {
      setIndex(((i % n) + n) % n);
      setCycle((c) => c + 1);
    },
    [n],
  );

  useEffect(() => {
    if (paused || n < 2) return;
    const id = setTimeout(() => go(index + 1), BANNER_INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, go, n, cycle]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const wa = (text?: string) => `${whatsappBase}?text=${encodeURIComponent(text || "Здравствуйте!")}`;
  const slide = slides[index];

  return (
    <section
      className="relative isolate -mt-24 flex min-h-[680px] items-end overflow-hidden pb-40 pt-[150px] sm:min-h-[760px] sm:pb-52 lg:h-[96vh] lg:max-h-[1000px] lg:min-h-[800px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
      aria-roledescription="carousel"
      aria-label="Баннер"
    >
      {/* Картинки */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-20 transition-opacity duration-[1200ms] ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <img
            key={i === index ? `on-${cycle}` : "off"}
            src={s.image}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={`h-full w-full object-cover object-[70%_center] ${i === index ? "animate-ken" : ""}`}
          />
        </div>
      ))}

      {/* Тонировка в цвет темы */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/75 to-ink/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/20 to-ink/60" />
      <div className="absolute inset-0 -z-10 bg-brand/10 mix-blend-color" />
      <div className="absolute -left-40 bottom-0 -z-10 h-[60%] w-[60%] animate-glow rounded-full bg-flame/25 blur-[120px]" />

      {/* Текст */}
      <div className="container relative">
        <div key={`${slide.id}-${cycle}`} className="max-w-5xl">
          <span className="inline-flex animate-slide-in items-center gap-2 rounded-full border border-brand/40 bg-ink/40 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {slide.eyebrow}
          </span>
          <h1 className="h-display mt-6 text-[2.5rem] leading-[1.02] sm:text-6xl lg:text-[4.2rem] xl:text-[4.8rem]">
            {slide.title.map((line, i) => (
              <span
                key={line}
                className={`block animate-slide-in ${i === slide.accentLine ? "text-gradient pb-1" : ""}`}
                style={{ animationDelay: `${120 + i * 110}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>
          <p
            className="mt-6 max-w-xl animate-slide-in text-base leading-relaxed text-white/75 sm:text-lg lg:text-xl"
            style={{ animationDelay: `${180 + slide.title.length * 110}ms` }}
          >
            {slide.text}
          </p>
          <div
            className="mt-8 flex animate-slide-in flex-wrap gap-3"
            style={{ animationDelay: `${260 + slide.title.length * 110}ms` }}
          >
            <Link href={slide.cta.href} className="btn-brand group px-7 py-4 text-base">
              {slide.cta.label}
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a href={wa(slide.whatsappText)} target="_blank" rel="noopener" className="btn-ghost px-6 py-4 text-base backdrop-blur-md">
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Навигация */}
      {n > 1 && (
        <div className="absolute inset-x-0 bottom-24 sm:bottom-32">
          <div className="container flex items-end gap-4">
            <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-4">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => go(i)}
                  aria-label={`Слайд ${i + 1}: ${s.eyebrow}`}
                  aria-current={i === index}
                  className="group text-left"
                >
                  <span className="relative block h-1 overflow-hidden rounded-full bg-white/15">
                    {i === index ? (
                      <span
                        key={cycle}
                        className="absolute inset-0 origin-left animate-progress rounded-full bg-brand"
                        style={{ animationDuration: `${BANNER_INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }}
                      />
                    ) : (
                      <span className={`absolute inset-0 rounded-full ${i < index ? "bg-white/40" : ""}`} />
                    )}
                  </span>
                  <span
                    className={`mt-2.5 hidden text-xs font-bold uppercase tracking-wider transition-colors sm:block ${
                      i === index ? "text-white" : "text-white/40 group-hover:text-white/70"
                    }`}
                  >
                    <span className="mr-2 text-brand">0{i + 1}</span>
                    {s.eyebrow}
                  </span>
                </button>
              ))}
            </div>
            <div className="hidden gap-2 md:flex">
              <button onClick={() => go(index - 1)} aria-label="Предыдущий слайд" className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-ink/40 backdrop-blur-md transition hover:border-brand/60 hover:text-brand">
                <ChevronLeft />
              </button>
              <button onClick={() => go(index + 1)} aria-label="Следующий слайд" className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-ink/40 backdrop-blur-md transition hover:border-brand/60 hover:text-brand">
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
