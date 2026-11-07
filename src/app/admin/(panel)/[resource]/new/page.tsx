import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/admin/registry";
import { requirePagePermission } from "@/lib/admin-guard";
import { listBrands } from "@/lib/catalog-refs";
import { ItemForm } from "@/components/admin/ItemForm";
import { ArrowLeft } from "@/components/icons";

export default async function NewItemPage({ params }: { params: Promise<{ resource: string }> }) {
  const mod = getResource((await params).resource);
  if (!mod) notFound();
  await requirePagePermission(mod.permission);
  return (
    <div className="space-y-5">
      <Link href={mod.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> {mod.title}
      </Link>
      <h1 className="font-display text-2xl font-bold">Добавить {mod.singular}</h1>
      <ItemForm itemType={mod.itemType} backHref={mod.href} brands={listBrands()} />
    </div>
  );
}
