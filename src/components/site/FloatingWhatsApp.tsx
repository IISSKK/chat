import { WhatsAppIcon } from "@/components/icons";

export function FloatingWhatsApp({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      className="press fixed bottom-5 right-4 z-30 grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-[#25D366]/90 text-white shadow-[0_12px_32px_-10px_rgba(37,211,102,.8),inset_0_1px_0_rgba(255,255,255,.4)] hover:bg-[#25D366] sm:right-5"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
