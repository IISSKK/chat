"use client";

import Link from "@/components/site/LocLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { RatesTicker } from "./RatesTicker";
import { SearchBox } from "./SearchBox";
import { CloseIcon, HeartIcon, MenuIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import { useFavorites } from "@/lib/favorites-client";
import { InstallApp } from "./InstallApp";
import { useT } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { WaButton, type WaOption } from "./WaButton";

export function Header({ wa }: { wa: WaOption[] }) {
  const ru = useT();
  const NAV = [
    { href: "/catalog/cars", label: ru.nav.cars },
    { href: "/catalog/engines", label: ru.nav.engines },
    { href: "/parts", label: ru.nav.parts },
    { href: "/about", label: ru.nav.about },
    { href: "/#contacts", label: ru.nav.contacts },
  ];
  const rawPathname = usePathname();
  const pathname = stripLocale(rawPathname).path;
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const { count: favCount } = useFavorites();

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
          <span className="hidden shrink-0 text-[11px] font-bold uppercase tracking-wider text-fg/55 lg:inline">{ru.rates.title}</span>
          <RatesTicker />
        </div>
      </div>

      <div className="container flex h-[60px] items-center gap-3">
        <Logo />
        <nav className="ml-2 hidden shrink-0 items-center gap-0.5 rounded-full bg-fg/[0.05] p-1 lg:flex xl:ml-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`press whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors xl:px-4 ${
                isActive(n.href) ? "bg-white text-fg shadow-[0_1px_4px_rgba(15,40,90,.12)]" : "text-fg/70 hover:text-fg"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-full min-w-0 max-w-sm xl:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <LanguageSwitcher />
          <Link href="/favorites" className="press relative grid h-10 w-10 place-items-center rounded-full bg-fg/[0.06] text-fg/80 hover:bg-fg/10" aria-label={ru.fav.title} title={ru.fav.title}>
            <HeartIcon className="h-[18px] w-[18px]" fill={favCount ? "currentColor" : "none"} />
            {favCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-flame px-1 text-[11px] font-bold text-white">{favCount}</span>}
          </Link>
          <button
            onClick={() => setSearch((s) => !s)}
            className="grid h-10 w-10 place-items-center rounded-full bg-fg/[0.06] text-fg/80 hover:bg-fg/10 xl:hidden"
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
        <div className="container animate-fade-up pb-3 xl:hidden">
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
            {[{ href: "/", label: ru.nav.home }, ...NAV, { href: "/favorites", label: ru.fav.title }].map((n) => (
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
          <InstallApp className="mt-3 w-full" />
          <div className="mt-3">
            <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-fg/58">{ru.lang.label}</p>
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
