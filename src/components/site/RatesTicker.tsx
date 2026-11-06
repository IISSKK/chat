"use client";

import { useEffect, useState } from "react";

type Rates = { USD: number; EUR: number; KRW: number; updated: number };

const fmt = (n: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: n < 10 ? 2 : 1 }).format(n);

/** Курсы USD / EUR / KRW к воне. Обновляются каждые 10 минут (ответ API кешируется на сервере). */
export function RatesTicker({ className = "" }: { className?: string }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/rates")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && d && d.USD) {
            setRates(d);
            setFlash(true);
            setTimeout(() => setFlash(false), 900);
          }
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const skeleton = <span className="inline-block h-3 w-10 rounded img-skeleton align-middle" />;
  const cell = (code: string, value: React.ReactNode) => (
    <span className={`tabular-nums transition-colors duration-700 ${flash ? "text-brand" : "text-white/85"}`}>
      <span className="text-white/45">{code}</span> {value}
    </span>
  );

  return (
    <div
      className={`flex items-center gap-3 whitespace-nowrap text-xs font-semibold ${className}`}
      title={rates ? `Курс к корейской воне · ${new Date(rates.updated).toLocaleString("ru-RU")}` : "Курс к корейской воне"}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
      </span>
      {cell("USD", rates ? `₩${fmt(rates.USD)}` : skeleton)}
      {cell("EUR", rates ? `₩${fmt(rates.EUR)}` : skeleton)}
      {cell("KRW", rates ? `₩1 = $${(1 / rates.USD).toFixed(5)}` : skeleton)}
    </div>
  );
}
