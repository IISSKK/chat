"use client";

import { useEffect, useState } from "react";
import ru from "@/i18n/dictionaries/ru";

type Stats = { today: number; week: number; month: number; total: number };

/** Регистрирует визит (один раз за загрузку вкладки) и показывает счётчик посещений. */
export function VisitCounter() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    const key = "korida_visit_sent";
    let sent = false;
    try {
      sent = sessionStorage.getItem(key) === "1";
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch("/api/visit", { method: sent ? "GET" : "POST" })
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
  }, []);

  const cells: [string, number | undefined][] = [
    [ru.footer.today, s?.today],
    [ru.footer.week, s?.week],
    [ru.footer.month, s?.month],
    [ru.footer.total, s?.total],
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map(([label, v]) => (
        <div key={label} className="rounded-2xl bg-white/[0.04] px-2 py-2.5 text-center">
          <div className="font-display text-base font-bold tabular-nums text-white sm:text-lg">
            {v === undefined ? <span className="mx-auto block h-5 w-8 rounded img-skeleton" /> : new Intl.NumberFormat("ru-RU").format(v)}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
        </div>
      ))}
    </div>
  );
}
