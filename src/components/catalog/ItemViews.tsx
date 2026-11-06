"use client";

import { useEffect, useState } from "react";
import { EyeIcon } from "@/components/icons";
import { viewsLabel } from "@/lib/utils";

/** Засчитывает просмотр объявления (один раз на посетителя) и показывает, сколько людей его посмотрели. */
export function ItemViews({ id, initial }: { id: number; initial: number }) {
  const [views, setViews] = useState(initial);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${id}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.views === "number" && d.views !== initial) {
          setViews(d.views);
          setBump(true);
        }
      })
      .catch(() => {});
  }, [id, initial]);

  return (
    <span className={`chip gap-1.5 bg-brand/10 text-brand ${bump ? "animate-pop-in" : ""}`} title="Сколько людей посмотрели объявление">
      <EyeIcon className="h-3.5 w-3.5" />
      <b className="tabular-nums">{new Intl.NumberFormat("ru-RU").format(views)}</b> {viewsLabel(views)}
    </span>
  );
}
