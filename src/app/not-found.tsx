import Link from "@/components/site/LocLink";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 text-center">
      <div className="page-bg" aria-hidden />
      <div>
        <div className="h-display text-8xl text-gradient">404</div>
        <p className="mt-4 text-fg/70">{t.common.notFound}</p>
        <Link href="/" className="btn-brand mt-8">{t.common.toHome}</Link>
      </div>
    </div>
  );
}
