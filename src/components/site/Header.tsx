"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { RatesTicker } from "./RatesTicker";
import { SearchBox } from "./SearchBox";
import { CloseIcon, MenuIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { WaButton, type WaOption } from "./WaButton";

export function Header({ wa }: { wa: WaOption[] }) {
  const ru = useT();
  const NAV = [
    { href: "/catalog/cars", label: ru.nav.cars },
    { href: "/catalog/engines", label: ru.nav.engines },
    { href: "/about", label: ru.nav.about },
    { href: "/#contacts", label: ru.nav.contacts },
  ];
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <>
    <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 border-b-white/60 shadow-[0_1px_0_rgba(15,40,90,.06)]">
      {/* Курсы валют онлайн */}
      <div className="border-b border-fg/[0.06]">
        <div className="container flex h-9 items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="hidden shrink-0 text-[11px] font-bold uppercase tracking-wider text-fg/40 lg:inline">{ru.rates.title}</span>
          <RatesTicker />
        </div>
      </div>

      <div className="container flex h-[60px] items-center gap-3">
        <Logo />
        <nav className="ml-4 hidden items-center gap-0.5 rounded-full bg-fg/[0.05] p-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`press rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive(n.href) ? "bg-white text-fg shadow-[0_1px_4px_rgba(15,40,90,.12)]" : "text-fg/60 hover:text-fg"
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
          <LanguageSwitcher />
          <button
            onClick={() => setSearch((s) => !s)}
            className="grid h-10 w-10 place-items-center rounded-full bg-fg/[0.06] text-fg/80 hover:bg-fg/10 md:hidden"
            aria-label={ru.nav.search}
          >
            {search ? <CloseIcon /> : <SearchIcon />}
          </button>
          <WaButton options={wa} placement="down" align="right" className="btn-wa px-4 py-2.5" wrapperClassName="hidden sm:block">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </WaButton>
          <button
            onClick={() => setMenu(true)}
            className="grid h-10 w-10 place-items-center rounded-full bg-fg/[0.06] text-fg hover:bg-fg/10 lg:hidden"
            aria-label={ru.nav.menu}
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

    </header>

      {/* Мобильное меню (лист снизу, как в iOS) */}
      <div className={`fixed inset-0 z-50 lg:hidden ${menu ? "" : "pointer-events-none"}`} aria-hidden={!menu}>
        <div
          onClick={() => setMenu(false)}
          className={`absolute inset-0 bg-fg/25 transition-opacity duration-300 ${menu ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`glass absolute inset-x-2 bottom-2 rounded-[28px] p-3 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
            menu ? "translate-y-0" : "translate-y-[110%]"
          }`}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-fg/15" />
          <div className="mb-2 flex items-center justify-between px-2">
            <Logo />
            <button onClick={() => setMenu(false)} className="grid h-9 w-9 place-items-center rounded-full bg-fg/[0.06]" aria-label={ru.nav.close}>
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white/70">
            {[{ href: "/", label: ru.nav.home }, ...NAV].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className={`press flex items-center justify-between border-b border-fg/[0.06] px-4 py-3.5 text-[17px] font-semibold last:border-0 active:bg-fg/[0.04] ${
                  isActive(n.href) ? "text-brand" : ""
                }`}
              >
                {n.label}
                <span className="text-fg/25">›</span>
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-fg/45">{ru.lang.label}</p>
            <LanguageSwitcher variant="row" />
          </div>
          <WaButton options={wa} placement="up" className="btn-wa w-full py-4 text-base" wrapperClassName="mt-3">
            <WhatsAppIcon /> {ru.home.writeWhatsapp}
          </WaButton>
        </div>
      </div>
    </>
  );
}
