"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { photoUrl } from "@/lib/utils";
import ru from "@/i18n/dictionaries/ru";

type Suggestion = {
  id: number;
  slug: string;
  title: string;
  type: "car" | "engine" | "part";
  match: string;
  field: "vin" | "serial" | "model" | "year" | "engine_code";
  photo?: string;
  status: string;
};

const fieldLabel: Record<Suggestion["field"], string> = {
  vin: "VIN",
  serial: "S/N",
  model: "Модель",
  year: "Год",
  engine_code: "Код ДВС",
};

function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-brand/25 px-0.5 text-brand">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function SearchBox({
  size = "md",
  autoFocus = false,
  defaultValue = "",
  onDone,
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  defaultValue?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => {
          setItems(d.results ?? []);
          setActive(-1);
          setLoading(false);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    onDone?.();
    router.push(href);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(`/item/${items[active].id}-${items[active].slug}`);
    if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    }
  };

  const lg = size === "lg";
  const term = q.trim();
  const showPanel = open && term.length >= 2;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={submit}
        role="search"
        className={`group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl transition-all duration-300 focus-within:border-brand/60 focus-within:bg-white/[0.09] focus-within:shadow-[0_0_0_6px_rgb(var(--c-brand)/0.1)] ${
          lg ? "p-1.5 pl-5 sm:p-2 sm:pl-6" : "p-1 pl-4"
        }`}
      >
        <SearchIcon
          className={`shrink-0 text-white/50 transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-brand ${
            lg ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4 w-4"
          }`}
        />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={ru.search.placeholder}
          aria-label={ru.search.placeholder}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          enterKeyHint="search"
          className={`min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40 ${
            lg ? "py-2 text-base sm:text-lg" : "py-1.5 text-sm"
          }`}
        />
        {loading && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />}
        <button type="submit" className={`btn-brand shrink-0 ${lg ? "px-5 py-3 text-sm sm:px-7 sm:text-base" : "px-3 py-2 text-xs"}`}>
          {lg ? ru.search.button : <SearchIcon className="h-4 w-4" />}
          {!lg && <span className="sr-only">{ru.search.button}</span>}
        </button>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 origin-top animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-ink-800/95 p-2 text-left shadow-2xl backdrop-blur-2xl"
        >
          {!loading && items.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-white/50">{ru.common.noResults}</div>
          )}
          {items.map((s, i) => (
            <button
              key={s.id}
              role="option"
              aria-selected={i === active}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(`/item/${s.id}-${s.slug}`)}
              style={{ animationDelay: `${i * 30}ms` }}
              className={`flex w-full animate-fade-up items-center gap-3 rounded-2xl p-2 text-left transition-colors ${
                i === active ? "bg-white/[0.08]" : ""
              }`}
            >
              <span className="h-11 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                {s.photo && <img src={photoUrl(s.photo)} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  <Highlight text={s.title} q={term} />
                </span>
                <span className="flex items-center gap-2 text-xs text-white/50">
                  <span className="rounded-full bg-ember/20 px-2 py-0.5 text-[10px] font-bold uppercase text-ember-400">
                    {fieldLabel[s.field]}
                  </span>
                  <span className="truncate font-mono">
                    <Highlight text={s.match} q={term} />
                  </span>
                </span>
              </span>
              {s.status === "sold" && (
                <span className="rounded-full bg-flame/20 px-2 py-0.5 text-[10px] font-bold text-flame">SOLD</span>
              )}
            </button>
          ))}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => go(`/search?q=${encodeURIComponent(term)}`)}
              className="mt-1 w-full rounded-2xl px-3 py-2.5 text-left text-xs font-bold text-brand hover:bg-white/[0.05]"
            >
              Все результаты по «{term}» →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
