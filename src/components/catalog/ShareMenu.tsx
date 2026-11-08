"use client";

import { useEffect, useRef, useState } from "react";
import { FacebookIcon, LinkIcon, ShareIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons";
import { useT } from "@/i18n/client";

export function ShareMenu({ url, title, className = "", compact = false }: { url: string; title: string; className?: string; compact?: boolean }) {
  const ru = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`, icon: <WhatsAppIcon className="h-4 w-4" />, color: "bg-[#25D366]" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <FacebookIcon className="h-4 w-4" />, color: "bg-[#1877F2]" },
    { label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${text}`, icon: <TelegramIcon className="h-4 w-4" />, color: "bg-[#229ED9]" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={ru.actions.share}
        title={ru.actions.share}
        className={`btn-ghost h-full min-h-[44px] w-full px-3.5 py-2.5 ${open ? "border-brand/50 text-brand" : ""}`}
      >
        <ShareIcon className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-12 scale-110" : ""}`} />
        {!compact && <span className="hidden sm:inline">{ru.actions.share}</span>}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-52 origin-bottom-right animate-fade-up glass rounded-2xl p-1.5">
          {links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener"
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="flex animate-fade-up items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition hover:bg-fg/[0.08]"
            >
              <span className={`grid h-7 w-7 place-items-center rounded-full text-white ${l.color}`}>{l.icon}</span>
              {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition hover:bg-fg/[0.08]"
          >
            <span className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${copied ? "bg-brand text-white" : "bg-fg/10"}`}>
              <LinkIcon className="h-4 w-4" />
            </span>
            {copied ? ru.actions.copied : ru.actions.copyLink}
          </button>
        </div>
      )}
    </div>
  );
}
