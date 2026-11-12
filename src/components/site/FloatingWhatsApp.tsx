import { WhatsAppIcon } from "@/components/icons";
import { WaButton, type WaOption } from "./WaButton";

export function FloatingWhatsApp({ options, label, chooseLabel }: { options: WaOption[]; label: string; chooseLabel: string }) {
  return (
    <div className="fixed bottom-5 right-4 z-30 sm:right-5" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <WaButton
        options={options}
        placement="up"
        align="right"
        ariaLabel={label}
        chooseLabel={chooseLabel}
        className="press grid h-12 w-12 place-items-center rounded-full lg:h-14 lg:w-14 border border-white/40 bg-[#25D366]/90 text-white shadow-[0_12px_32px_-10px_rgba(37,211,102,.8),inset_0_1px_0_rgba(255,255,255,.4)] hover:bg-[#25D366]"
      >
        <WhatsAppIcon className="h-6 w-6 lg:h-7 lg:w-7" />
      </WaButton>
    </div>
  );
}
