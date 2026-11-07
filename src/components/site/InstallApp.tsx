"use client";

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { DownloadIcon } from "@/components/icons";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Регистрирует service worker (офлайн-страница, быстрая загрузка статики) и показывает кнопку «Установить приложение». */
export function InstallApp({ className = "" }: { className?: string }) {
  const t = useT();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return setInstalled(true);
    const ua = navigator.userAgent;
    setIos(/iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (evt) {
    return (
      <button type="button" onClick={async () => { await evt.prompt(); setEvt(null); }} className={`btn-ghost ${className}`}>
        <DownloadIcon className="h-4 w-4 text-brand" /> {t.pwa.install}
      </button>
    );
  }
  if (ios) return <p className={`rounded-2xl bg-fg/[0.05] px-4 py-3 text-xs text-fg/70 ${className}`}>📲 {t.pwa.iosHint}</p>;
  return null;
}
