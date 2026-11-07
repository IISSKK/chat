"use client";

import { useEffect, useState } from "react";
import { EyeIcon } from "@/components/icons";
import { useLocale, useT } from "@/i18n/client";
import { plural } from "@/i18n/format";

/** Засчитывает просмотр объявления (один раз на посетителя) и показывает, сколько людей его посмотрели. */
export function ItemViews({ id, initial }: { id: number; initial: number }) {
  const t = useT();
  const locale = useLocale();
  const [views, setViews] = useState(initial);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${id}/view?l=${locale}`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.views === "number" && d.views !== initial) {
          setViews(d.views);
          setBump(true);
        }
      })
      .catch(() => {});
  }, [id, initial, locale]);

  return (
    <span className={`chip gap-1.5 bg-brand/10 text-brand ${bump ? "animate-pop-in" : ""}`} title={t.views.title}>
      <EyeIcon className="h-3.5 w-3.5" />
      <b className="tabular-nums">{new Intl.NumberFormat(t.meta.intl).format(views)}</b> {plural(views, t.views, t.meta.intl)}
    </span>
  );
}
