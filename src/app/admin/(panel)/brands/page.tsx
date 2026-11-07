import { BrandsManager } from "@/components/admin/BrandsManager";
import { listBrands, brandUsage, modelUsage } from "@/lib/catalog-refs";
import { requirePagePermission } from "@/lib/admin-guard";

export default async function BrandsPage() {
  await requirePagePermission("cars");
  const brands = listBrands().map((b) => ({ ...b, used: brandUsage(b.id), models: b.models.map((m) => ({ ...m, used: modelUsage(m.id) })) }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Марки и модели</h1>
        <p className="text-sm text-slate-500">
          Справочник для формы объявления: марку и модель выбирают из списка, поэтому нет опечаток («Hyunday») и дублей в фильтрах и поиске.
          Из этих данных строятся страницы марок на сайте. Переименование сразу обновляет все объявления.
        </p>
      </div>
      <BrandsManager initial={brands} />
    </div>
  );
}
