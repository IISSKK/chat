import type { Item } from "@/lib/types";
import { getT } from "@/i18n/server";
import { waOptions } from "@/lib/contacts";
import { ItemCardView } from "./ItemCardView";

export { SoldBadge, ViewsBadge, specChips, ItemCardView } from "./ItemCardView";

/** Карточка объявления (серверная обёртка: подставляет язык и номера WhatsApp) */
export async function ItemCard({ item, index = 0, priority = false }: { item: Item; index?: number; priority?: boolean }) {
  const t = await getT();
  return <ItemCardView item={item} t={t} index={index} priority={priority} price={waOptions("price", item.id, t.meta.code)} docs={waOptions("docs", item.id, t.meta.code)} />;
}

export function ItemGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it, i) => (
        <ItemCard key={it.id} item={it} index={i} priority={i < 2} />
      ))}
    </div>
  );
}
