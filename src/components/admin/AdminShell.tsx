"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminIcon, AdminModule } from "@/admin/types";
import { CarIcon, ChartIcon, CloseIcon, EngineIcon, EyeIcon, GearIcon, GridIcon, LogoutIcon, MailIcon, MenuIcon } from "@/components/icons";

const ICONS: Record<AdminIcon, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  dashboard: GridIcon, car: CarIcon, engine: EngineIcon, part: GearIcon, chart: ChartIcon,
  inbox: MailIcon, image: EyeIcon, text: GridIcon, users: GridIcon, phone: MailIcon,
};

export function AdminShell({
  modules,
  groups,
  user,
  children,
}: {
  modules: AdminModule[];
  groups: Record<string, string>;
  user: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const grouped = modules.reduce<Record<string, AdminModule[]>>((acc, m) => {
    (acc[m.group] ??= []).push(m);
    return acc;
  }, {});

  const nav = (
    <nav className="flex h-full flex-col">
      <Link href="/admin" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet to-hot font-display font-extrabold text-lime">K</span>
        <span>
          <span className="block font-display text-sm font-bold text-slate-900">KORIDA</span>
          <span className="block text-[11px] text-slate-500">Панель управления</span>
        </span>
      </Link>
      <div className="flex-1 space-y-5 overflow-y-auto">
        {Object.entries(grouped).map(([group, list]) => (
          <div key={group}>
            {groups[group] && <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{groups[group]}</p>}
            <ul className="space-y-0.5">
              {list.map((m) => {
                const Icon = ICONS[m.icon] ?? GridIcon;
                const on = isActive(m.href);
                return (
                  <li key={m.id}>
                    <Link
                      href={m.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        on ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {m.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1 border-t border-slate-200 pt-4">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          <EyeIcon className="h-[18px] w-[18px]" /> Открыть сайт
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600">
          <LogoutIcon className="h-[18px] w-[18px]" /> Выйти <span className="ml-auto text-xs font-normal text-slate-400">{user}</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 [color-scheme:light]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-4 lg:block">{nav}</aside>

      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 w-72 bg-white p-4 shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Закрыть">
            <CloseIcon className="h-5 w-5" />
          </button>
          {nav}
        </aside>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Меню">
            <MenuIcon />
          </button>
          <span className="font-display text-sm font-bold">KORIDA Admin</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
