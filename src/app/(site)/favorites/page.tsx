import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { FavoritesView } from "@/components/catalog/FavoritesView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.fav.title, robots: { index: false, follow: false } };
}

export default async function FavoritesPage() {
  const t = await getT();
  return (
    <div className="container">
      <div className="mb-8 pt-8 sm:pt-12">
        <h1 className="h-display text-3xl sm:text-5xl">{t.fav.title}</h1>
      </div>
      <FavoritesView />
    </div>
  );
}
