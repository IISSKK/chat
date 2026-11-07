"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { fmt as tpl } from "@/i18n/format";

const CODES = ["USD", "EUR", "KGS", "KRW"] as const;
type Code = (typeof CODES)[number];
type Rates = Record<Code, number>; // единиц валюты за 1 USD

const BASES: Code[] = ["KRW", "KGS", "USD"];
const FLAG: Record<Code, string> = { USD: "🇺🇸", EUR: "🇪🇺", KGS: "🇰🇬", KRW: "🇰🇷" };
/** Для «мелких» валют показываем курс за 100/1000 единиц */
const UNIT: Record<Code, number> = { USD: 1, EUR: 1, KGS: 100, KRW: 1000 };
const POLL_MS = 60_000;
const STORAGE = "bk-rates-base";

function fmt(n: number, intl: string) {
  const digits = n >= 100 ? 1 : n >= 10 ? 2 : 3;
  return new Intl.NumberFormat(intl, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** Курсы USD / EUR / сом / вона онлайн: обновление каждую минуту, подсветка роста и падения, выбор валюты отображения. */
export function RatesTicker({ className = "" }: { className?: string }) {
  const t = useT();
  const SYMBOL: Record<Code, string> = { USD: "$", EUR: "€", KGS: t.rates.som, KRW: "₩" };
  const [rates, setRates] = useState<Rates | null>(null);
  const [updated, setUpdated] = useState<number>(0);
  const [base, setBase] = useState<Code>("KRW");
  const [older, setOlder] = useState<Rates | null>(null); // курсы до последнего обновления (для стрелок ▲▼)
  const prev = useRef<Rates | null>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem(STORAGE) as Code | null;
      if (b && CODES.includes(b)) setBase(b);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const d = await fetch("/api/rates").then((r) => (r.ok ? r.json() : null));
        if (alive && d?.rates) {
          const next = d.rates as Rates;
          if (prev.current && CODES.some((c) => prev.current![c] !== next[c])) {
            setOlder(prev.current);
            setTimeout(() => alive && setOlder(null), 5000);
          }
          prev.current = next;
          setRates(next);
          setUpdated(d.updated);
        }
      } catch {}
      if (alive) timer = setTimeout(load, document.hidden ? POLL_MS * 3 : POLL_MS);
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const choose = (c: Code) => {
    setBase(c);
    try {
      localStorage.setItem(STORAGE, c);
    } catch {}
  };

  const others = CODES.filter((c) => c !== base);

  return (
    <div className={`flex items-center gap-2.5 whitespace-nowrap text-xs font-semibold ${className}`}>
      <span className="relative flex h-2 w-2 shrink-0" title={updated ? tpl(t.rates.updated, { time: new Date(updated).toLocaleTimeString(t.meta.intl) }) : t.rates.title}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34C759] opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34C759]" />
      </span>
      {others.map((c) => {
        const value = rates ? (rates[base] / rates[c]) * UNIT[c] : null;
        const was = older ? (older[base] / older[c]) * UNIT[c] : null;
        const tr = value !== null && was !== null && Math.abs(value - was) / was > 1e-6 ? (value > was ? 1 : -1) : 0;
        return (
          <span key={c} className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 tabular-nums ${tr ? "animate-flash" : ""}`}>
            <span aria-hidden>{FLAG[c]}</span>
            <span className="text-fg/70">{UNIT[c] > 1 ? `${UNIT[c]} ${c}` : c}</span>
            {value === null ? (
              <span className="inline-block h-3 w-10 rounded img-skeleton align-middle" />
            ) : (
              <span className="text-fg/85">
                {fmt(value, t.meta.intl)} {SYMBOL[base]}
              </span>
            )}
            {tr === 1 && <span className="text-[#34C759]">▲</span>}
            {tr === -1 && <span className="text-[#FF3B30]">▼</span>}
          </span>
        );
      })}
      <span className="ml-0.5 flex shrink-0 items-center rounded-full bg-fg/[0.09] p-0.5" role="radiogroup" aria-label={t.rates.base}>
        {BASES.map((b) => (
          <button
            key={b}
            role="radio"
            aria-checked={base === b}
            onClick={() => choose(b)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${base === b ? "bg-white text-brand shadow-sm" : "text-fg/72 hover:text-fg"}`}
          >
            {SYMBOL[b]}
          </button>
        ))}
      </span>
    </div>
  );
}
