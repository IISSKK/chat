import { requirePagePermission } from "@/lib/admin-guard";
import { listItems } from "@/lib/items";
import { getCover } from "@/lib/covers";
import { photoUrl } from "@/lib/utils";
import { CoversEditor } from "@/components/admin/CoversEditor";

export const dynamic = "force-dynamic";

export default async function CoversPage() {
  const me = await requirePagePermission();
  const slot = (kind: "car" | "engine", title: string) => {
    const custom = getCover(kind);
    const auto = listItems({ type: kind, status: "available" }, 1, 1).items[0]?.photos[0]?.filename;
    const file = custom ?? auto;
    return { kind, title, image: file ? photoUrl(file, "sm") : null, custom: !!custom, allowed: me.permissions.has(kind === "car" ? "cars" : "engines") };
  };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Обложки главной</h1>
        <p className="text-sm text-slate-500">Фото на больших карточках «Автомобили» и «Двигатели» на главной. По умолчанию берётся первое фото самого свежего объявления; можно загрузить свою картинку.</p>
      </div>
      <CoversEditor slots={[slot("car", "Автомобили"), slot("engine", "Двигатели")]} />
    </div>
  );
}
