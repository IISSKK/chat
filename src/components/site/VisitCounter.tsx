"use client";

import { useEffect, useState } from "react";
import ru from "@/i18n/dictionaries/ru";

type Stats = { today: number; week: number; month: number; unique: number };

/** Регистрирует визит (один раз за загрузку вкладки) и показывает счётчик посещений. */
export function VisitCounter() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    // Визит регистрирует плавающий виджет; здесь только читаем статистику
    const t = setTimeout(() => {
      fetch("/api/visit")
        .then((r) => r.json())
        .then(setS)
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const cells: [string, number | undefined][] = [
    [ru.footer.today, s?.today],
    [ru.footer.week, s?.week],
    [ru.footer.month, s?.month],
    [ru.footer.total, s?.unique],
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map(([label, v]) => (
        <div key={label} className="rounded-2xl border border-white/80 bg-white/60 px-2 py-2.5 text-center">
          <div className="font-display text-base font-bold tabular-nums text-fg sm:text-lg">
            {v === undefined ? <span className="mx-auto block h-5 w-8 rounded img-skeleton" /> : new Intl.NumberFormat("ru-RU").format(v)}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg/40">{label}</div>
        </div>
      ))}
    </div>
  );
}
