import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-ink px-4 text-center text-white">
      <div>
        <div className="font-display text-8xl font-extrabold text-gradient">404</div>
        <p className="mt-4 text-white/60">Страница не найдена или товар был удалён.</p>
        <Link href="/" className="btn-brand mt-8">На главную</Link>
      </div>
    </div>
  );
}
