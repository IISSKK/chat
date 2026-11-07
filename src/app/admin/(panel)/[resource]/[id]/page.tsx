import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/admin/registry";
import { requirePagePermission } from "@/lib/admin-guard";
import { listBrands } from "@/lib/catalog-refs";
import { getTranslationState, getTranslations, translationEnabled } from "@/lib/translate";
import { ItemForm } from "@/components/admin/ItemForm";
import { ArrowLeft, EyeIcon } from "@/components/icons";
import { getItemAny } from "@/lib/items";
import { itemPath } from "@/lib/utils";

export default async function EditItemPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const mod = getResource(resource);
  const item = mod ? getItemAny(Number(id)) : null;
  if (!mod || !item || item.type !== mod.itemType) notFound();
  await requirePagePermission(mod.permission);
  return (
    <div className="space-y-5">
      <Link href={mod.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> {mod.title}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Редактирование #{item.id}</h1>
        <a href={itemPath(item)} target="_blank" className="a-btn-ghost"><EyeIcon className="h-4 w-4" /> На сайте</a>
      </div>
      <ItemForm
        key={item.updated_at}
        itemType={mod.itemType}
        backHref={mod.href}
        item={item}
        brands={listBrands()}
        translation={(() => {
          const st = getTranslationState(item.id, item);
          return { enabled: translationEnabled(), status: st.status, error: st.error, stale: st.stale, translations: getTranslations(item.id) };
        })()}
      />
    </div>
  );
}
