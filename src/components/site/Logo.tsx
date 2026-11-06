import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={siteConfig.name}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-ember to-flame transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105">
        <span className="font-display text-lg font-extrabold text-brand">K</span>
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        {siteConfig.shortName}
        <span className="text-brand">.</span>
      </span>
    </Link>
  );
}
