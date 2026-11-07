import "server-only";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { Permission } from "@/admin/permissions";
import { can, getCurrentAdmin, type CurrentAdmin } from "./admins";

/** Если в .env задано REQUIRE_2FA=1 — без включённой 2FA работать в админке нельзя (только настроить её). */
export const twoFactorRequired = () => process.env.REQUIRE_2FA === "1";

/** Для страниц админки: нет права — возвращаем на обзор с сообщением. */
export async function requirePagePermission(perm?: Permission, opts: { allowWithout2fa?: boolean } = {}): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (twoFactorRequired() && !admin.twoFactor && !opts.allowWithout2fa) redirect("/admin/account?setup2fa=1");
  if (perm && !can(admin, perm)) redirect("/admin?denied=1");
  return admin;
}

/** Для API: возвращает администратора или готовый ответ 401/403. */
export async function requireApiPermission(...perms: Permission[]): Promise<CurrentAdmin | NextResponse> {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Нужно войти заново" }, { status: 401 });
  if (twoFactorRequired() && !admin.twoFactor) return NextResponse.json({ error: "Включите двухфакторную защиту в разделе «Мой аккаунт»" }, { status: 403 });
  if (perms.some((p) => !can(admin, p))) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  return admin;
}

/** Только для авторизованного (без проверки отдельного права): для «Мой аккаунт» */
export async function requireApiSession(): Promise<CurrentAdmin | NextResponse> {
  const admin = await getCurrentAdmin();
  return admin ?? NextResponse.json({ error: "Нужно войти заново" }, { status: 401 });
}
