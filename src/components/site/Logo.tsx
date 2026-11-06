import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`press group inline-flex items-center gap-2.5 ${className}`} aria-label={siteConfig.name}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] bg-gradient-to-br from-brand-400 via-brand to-ember shadow-[0_6px_16px_-6px_rgb(var(--c-brand)/0.7),inset_0_1px_0_rgba(255,255,255,.4)]">
        <span className="text-[17px] font-extrabold tracking-tight text-white">B</span>
        <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-flame" />
      </span>
      <span className="text-[17px] font-bold tracking-tight">
        Barakat <span className="text-brand">Auto</span>
      </span>
    </Link>
  );
}
