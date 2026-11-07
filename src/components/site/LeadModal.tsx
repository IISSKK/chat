"use client";

import { Select } from "@/components/ui/Select";
import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { useLocale, useT } from "@/i18n/client";
import { getAttribution } from "@/lib/attribution";
import LocLink from "./LocLink";

/** Страны, откуда чаще всего приходят покупатели (коды ISO — названия на языке посетителя берём из Intl.DisplayNames) */
const COUNTRIES = ["KG", "KZ", "UZ", "TJ", "TM", "RU", "MN", "GE", "AM", "AZ", "BY", "UA", "MD", "TR", "AE", "SA", "QA", "KW", "OM", "EG", "NG", "GH", "KE", "TZ", "UG", "ZM", "CM", "SN", "CI", "LY", "IQ", "JO", "LB", "AF", "PK", "VN", "KH", "PH", "NZ", "CL"];

type Status = "idle" | "sending" | "done" | "error";

/** Кнопка «Оставить заявку» + всплывающая форма. Защита от ботов: скрытое поле, время заполнения. */
export function LeadButton({ itemId, itemTitle, className = "btn-brand", children }: { itemId?: number; itemTitle?: string; className?: string; children?: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const opened = useRef(0);

  const names = (() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  })();
  const countryName = (c: string) => names?.of(c) ?? c;

  useEffect(() => {
    if (!open) return;
    opened.current = Date.now();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          contact: fd.get("contact"),
          country: fd.get("country") === "other" ? fd.get("country_other") || "" : new Intl.DisplayNames(["en"], { type: "region" }).of(String(fd.get("country"))) || "",
          message: fd.get("message"),
          website: fd.get("website"),
          elapsed: Date.now() - opened.current,
          itemId,
          lang: locale,
          ...getAttribution(),
        }),
      });
      if (res.ok) return setStatus("done");
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setError(data.error === "name" ? t.lead.errName : data.error === "contact" ? t.lead.errContact : data.error === "message" ? t.lead.errMessage : res.status === 429 ? t.lead.errRate : t.lead.errGeneric);
    } catch {
      setStatus("error");
      setError(t.lead.errGeneric);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setStatus("idle"); setError(""); setOpen(true); }} className={className}>
        {children ?? t.lead.button}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-fg/30 sm:place-items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal
            aria-label={t.lead.title}
            onClick={(e) => e.stopPropagation()}
            className="glass max-h-[92dvh] w-full max-w-md animate-pop-in overflow-y-auto rounded-t-[28px] !bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-[28px] sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">{status === "done" ? t.lead.thanksTitle : t.lead.title}</h2>
                {status !== "done" && <p className="mt-1 text-sm text-fg/80">{t.lead.intro}</p>}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fg/[0.09]" aria-label={t.nav.close}>
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {status === "done" ? (
              <div className="space-y-4">
                <p className="text-fg/80">{t.lead.thanksText}</p>
                <button type="button" onClick={() => setOpen(false)} className="btn-brand w-full">{t.nav.close}</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                {itemTitle && (
                  <p className="rounded-2xl bg-brand/10 px-3 py-2 text-sm">
                    <span className="text-fg/72">{t.lead.forItem}: </span>
                    <b>{itemTitle}</b>
                  </p>
                )}
                {/* ловушка для ботов: человек это поле не видит */}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-fg/72">{t.lead.name}</span>
                  <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="input" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-fg/72">{t.lead.contact}</span>
                  <input name="contact" required maxLength={120} autoComplete="tel" inputMode="text" placeholder={t.lead.contactHint} className="input" />
                </label>
                <CountryField countries={COUNTRIES} label={t.lead.country} other={t.lead.countryOther} nameOf={countryName} />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-fg/72">{t.lead.message}</span>
                  <textarea name="message" rows={3} maxLength={1500} placeholder={t.lead.messagePlaceholder} className="input resize-none" />
                </label>
                {error && <p className="animate-fade-in rounded-xl bg-[#FF3B30]/10 px-3 py-2 text-sm text-[#D70015]">{error}</p>}
                <button disabled={status === "sending"} className="btn-brand w-full py-3.5">{status === "sending" ? t.lead.sending : t.lead.send}</button>
                <p className="text-center text-[11px] text-fg/70">
                  {t.lead.consent}{" "}
                  <LocLink href="/privacy" className="underline" onClick={() => setOpen(false)}>{t.footer.privacy}</LocLink>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CountryField({ countries, label, other, nameOf }: { countries: string[]; label: string; other: string; nameOf: (c: string) => string }) {
  const [value, setValue] = useState("");
  const sorted = [...countries].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-fg/72">{label}</span>
        <Select name="country" value={value} onChange={setValue} aria-label={label} options={[{ value: "", label: "—" }, ...sorted.map((c) => ({ value: c, label: nameOf(c) })), { value: "other", label: other }]} />
      </label>
      {value === "other" && <input name="country_other" maxLength={60} placeholder={other} className="input" />}
    </div>
  );
}
