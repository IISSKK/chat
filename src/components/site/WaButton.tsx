import { WhatsAppIcon } from "@/components/icons";

export type WaOption = { name: string; phone: string; langs: string; href: string };

/**
 * Кнопка WhatsApp без JavaScript. Один номер — обычная ссылка. Несколько — выпадающий список «Кому написать?»
 * на нативном <details> (закрывается по клику вне списка и Esc через WaMenuCloser в общем макете).
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
  chooseLabel = "",
}: {
  options: WaOption[];
  className?: string;
  children: React.ReactNode;
  placement?: "up" | "down";
  align?: "left" | "right";
  ariaLabel?: string;
  /** Классы обёртки (например min-w-0 внутри grid) */
  wrapperClassName?: string;
  /** Заголовок списка номеров («Кому написать?») */
  chooseLabel?: string;
}) {
  if (options.length <= 1) {
    const link = (
      <a href={options[0]?.href ?? "#"} target="_blank" rel="noopener nofollow" className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
    return wrapperClassName ? <div className={wrapperClassName}>{link}</div> : link;
  }

  return (
    <details data-wa className={`group/wa relative open:z-40 ${wrapperClassName}`}>
      <summary className={`${className} cursor-pointer list-none [&::-webkit-details-marker]:hidden`} aria-label={ariaLabel} aria-haspopup="menu">
        {children}
      </summary>
      <div
        role="menu"
        className={`glass absolute z-50 w-64 max-w-[calc(100vw-2rem)] animate-pop-in rounded-2xl !bg-white p-1.5 ${
          placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
        } ${align === "right" ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"}`}
      >
        {chooseLabel && <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-fg/70">{chooseLabel}</p>}
        {options.map((o) => (
          <a key={o.href} role="menuitem" href={o.href} target="_blank" rel="noopener nofollow" className="press flex min-h-[48px] items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-fg/[0.09]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{o.name || o.phone}</span>
              <span className="block truncate text-xs text-fg/76">
                {o.name ? o.phone : ""}
                {o.langs ? `${o.name ? " · " : ""}${o.langs}` : ""}
              </span>
            </span>
          </a>
        ))}
      </div>
    </details>
  );
}
