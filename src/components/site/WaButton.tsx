"use client";

import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { useT } from "@/i18n/client";

export type WaOption = { name: string; phone: string; langs: string; href: string };

/**
 * Кнопка WhatsApp. Один номер — обычная ссылка. Несколько — по нажатию список «Кому написать?».
 * placement: куда открывать список (вверх — для кнопок внизу карточек и плавающей кнопки).
 */
export function WaButton({
  options,
  className = "",
  children,
  placement = "up",
  align = "left",
  ariaLabel,
  wrapperClassName = "",
}: {
  options: WaOption[];
  className?: string;
  children: React.ReactNode;
  placement?: "up" | "down";
  align?: "left" | "right";
  ariaLabel?: string;
  /** Классы обёртки (например min-w-0 внутри grid) */
  wrapperClassName?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (options.length <= 1) {
    const link = (
      <a href={options[0]?.href ?? "#"} target="_blank" rel="noopener nofollow" className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
    return wrapperClassName ? <div className={wrapperClassName}>{link}</div> : link;
  }

  return (
    <div ref={ref} className={`relative ${open ? "z-40" : ""} ${wrapperClassName}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label={ariaLabel} className={className}>
        {children}
      </button>
      {open && (
        <div
          role="menu"
          className={`glass absolute z-50 w-64 max-w-[calc(100vw-2rem)] animate-pop-in rounded-2xl !bg-white p-1.5 ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } ${align === "right" ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"}`}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-fg/45">{t.whatsapp.choose}</p>
          {options.map((o) => (
            <a
              key={o.href}
              role="menuitem"
              href={o.href}
              target="_blank"
              rel="noopener nofollow"
              onClick={() => setOpen(false)}
              className="press flex items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-fg/[0.06]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{o.name || o.phone}</span>
                <span className="block truncate text-xs text-fg/55">
                  {o.name ? o.phone : ""}
                  {o.langs ? `${o.name ? " · " : ""}${o.langs}` : ""}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
