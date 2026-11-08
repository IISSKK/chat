"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/i18n/client";
import { getAttribution } from "@/lib/attribution";

type Live = { online: number; unique: number; today: number };
const HEARTBEAT_MS = 30_000;

/**
 * Небольшое плавающее окошко: сколько людей сейчас на сайте и сколько всего посетили.
 * Также регистрирует визит (раз за сессию) и шлёт «пульс» раз в 30 секунд, пока вкладка видна.
 */
export function LiveWidget() {
  const ru = useT();
  const locale = useLocale();
  const fmt = (n: number) => new Intl.NumberFormat(ru.meta.intl).format(n);
  const [data, setData] = useState<Live | null>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    try {
      setHidden(sessionStorage.getItem("bk-live-hidden") === "1");
    } catch {}

    const first = async () => {
      let sent = false;
      try {
        sent = sessionStorage.getItem("bk-visit-sent") === "1";
        sessionStorage.setItem("bk-visit-sent", "1");
      } catch {}
      if (!sent) await fetch("/api/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...getAttribution(), lang: locale }) }).catch(() => {});
      beat();
    };
    const beat = async () => {
      if (!document.hidden) {
        const d = await fetch("/api/presence", { method: "POST" }).then((r) => r.json()).catch(() => null);
        if (alive && d) setData(d);
      }
      if (alive) timer = setTimeout(beat, HEARTBEAT_MS);
    };
    const onVis = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        beat();
      }
    };
    // Не мешаем отрисовке первого экрана: запросы статистики стартуют, когда браузер освободился
    const start = setTimeout(first, 1500);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearTimeout(start);
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const toggleHidden = (v: boolean) => {
    setHidden(v);
    setOpen(false);
    try {
      sessionStorage.setItem("bk-live-hidden", v ? "1" : "0");
    } catch {}
  };

  if (!data) return null;

  if (hidden) {
    return (
      <button
        onClick={() => toggleHidden(false)}
        aria-label={ru.live.title}
        className="glass fixed bottom-5 left-4 z-30 grid h-11 w-11 place-items-center rounded-full pb-[env(safe-area-inset-bottom)] sm:left-5"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34C759] opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#34C759]" />
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 left-4 z-30 sm:left-5" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      {open && (
        <div className="glass absolute bottom-full left-0 mb-2 w-60 origin-bottom-left animate-pop-in rounded-3xl p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg/70">{ru.live.title}</span>
            <button onClick={() => toggleHidden(true)} className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-fg/72 hover:bg-fg/[0.09]">
              {ru.live.hide}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              [data.online, ru.live.onlineShort, "text-[#34C759]"],
              [data.today, ru.live.today, "text-brand"],
              [data.unique, ru.live.totalShort, "text-flame"],
            ].map(([n, l, c]) => (
              <div key={l as string} className="rounded-2xl bg-white/70 px-1 py-2">
                <div className={`text-lg font-bold tabular-nums ${c}`}>{fmt(n as number)}</div>
                <div className="text-[10px] font-semibold text-fg/70">{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="glass flex min-h-[44px] items-center gap-2.5 rounded-full py-2 pl-3.5 pr-4 text-xs font-semibold"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34C759] opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#34C759]" />
        </span>
        <span className="tabular-nums">
          <b className="text-fg">{fmt(data.online)}</b> <span className="text-fg/76">{ru.live.online}</span>
        </span>
        <span className="h-3.5 w-px bg-fg/15" />
        <span className="tabular-nums">
          <b className="text-fg">{fmt(data.unique)}</b> <span className="hidden text-fg/76 min-[400px]:inline">{ru.live.total}</span>
          <span className="text-fg/76 min-[400px]:hidden">{ru.live.totalShort}</span>
        </span>
      </button>
    </div>
  );
}
