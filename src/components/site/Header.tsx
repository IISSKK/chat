"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { RatesTicker } from "./RatesTicker";
import { SearchBox } from "./SearchBox";
import { CloseIcon, MenuIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import ru from "@/i18n/dictionaries/ru";

const NAV = [
  { href: "/catalog/cars", label: ru.nav.cars },
  { href: "/catalog/engines", label: ru.nav.engines },
  { href: "/catalog/parts", label: ru.nav.parts },
  { href: "/about", label: ru.nav.about },
  { href: "/#contacts", label: ru.nav.contacts },
];

export function Header({ waHref }: { waHref: string }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40">
      {/* Строка курсов */}
      <div className="border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
        <div className="container flex h-8 items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <RatesTicker />
          <span className="hidden text-xs text-white/40 md:block">{ru.home.heroBadge}</span>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ${
          scrolled ? "border-b border-white/[0.08] bg-ink/80 shadow-[0_10px_40px_-20px_rgba(0,0,0,.8)] backdrop-blur-2xl" : "bg-transparent"
        }`}
      >
        <div className="container flex h-16 items-center gap-4">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive(n.href) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden w-full max-w-sm md:block">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button
              onClick={() => setSearch((s) => !s)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-white/80 transition hover:bg-white/10 md:hidden"
              aria-label={ru.nav.search}
            >
              {search ? <CloseIcon /> : <SearchIcon />}
            </button>
            <a href={waHref} target="_blank" rel="noopener" className="btn-wa hidden px-4 py-2.5 sm:inline-flex">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
            <button
              onClick={() => setMenu(true)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Меню"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {search && (
          <div className="container animate-fade-up pb-3 md:hidden">
            <SearchBox autoFocus onDone={() => setSearch(false)} />
          </div>
        )}
      </div>

      {/* Мобильное меню */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menu ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menu}
      >
        <div
          onClick={() => setMenu(false)}
          className={`absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${menu ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col gap-2 border-l border-white/10 bg-ink-800 p-5 transition-transform duration-300 ease-out ${
            menu ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <Logo />
            <button onClick={() => setMenu(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06]" aria-label="Закрыть">
              <CloseIcon />
            </button>
          </div>
          {[{ href: "/", label: ru.nav.home }, ...NAV].map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMenu(false)}
              style={{ transitionDelay: menu ? `${80 + i * 40}ms` : "0ms" }}
              className={`rounded-2xl px-4 py-3.5 font-display text-lg font-bold transition-all duration-300 hover:bg-white/[0.06] ${
                menu ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
              } ${isActive(n.href) ? "bg-white/[0.08] text-lime" : ""}`}
            >
              {n.label}
            </Link>
          ))}
          <a href={waHref} target="_blank" rel="noopener" className="btn-wa mt-auto w-full py-4 text-base">
            <WhatsAppIcon /> {ru.home.writeWhatsapp}
          </a>
        </div>
      </div>
    </header>
  );
}
