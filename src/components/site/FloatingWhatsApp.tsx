import { WhatsAppIcon } from "@/components/icons";

export function FloatingWhatsApp({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
      className="group fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-ink shadow-[0_10px_40px_-8px_rgba(37,211,102,.7)] transition-transform duration-300 hover:scale-110 active:scale-95"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30 [animation-duration:2.4s]" />
      <WhatsAppIcon className="relative h-7 w-7" />
    </a>
  );
}
