import { AccountPanel } from "@/components/admin/AccountPanel";
import { getTwoFactor } from "@/lib/admins";
import { requirePagePermission, twoFactorRequired } from "@/lib/admin-guard";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ setup2fa?: string }> }) {
  const me = await requirePagePermission(undefined, { allowWithout2fa: true });
  const sp = await searchParams;
  const st = getTwoFactor(me.id);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Мой аккаунт</h1>
        <p className="text-sm text-slate-500">
          {me.username}
          {me.isOwner ? " · владелец" : ""}
        </p>
      </div>
      {sp.setup2fa && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          На этом сайте требуется двухфакторная защита. Включите её ниже — без этого остальные разделы админки недоступны.
        </p>
      )}
      <AccountPanel twoFactor={st.enabled} recoveryLeft={st.recoveryHashes.length} isOwner={me.isOwner} required={twoFactorRequired()} />
    </div>
  );
}
