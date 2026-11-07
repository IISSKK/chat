import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { ALL_PERMISSIONS, sanitizePermissions, type Permission } from "@/admin/permissions";
import { getSetting, setSetting, deleteSetting } from "./settings";
import { decryptSecret, encryptSecret, hashRecovery, generateRecoveryCodes } from "./totp";

export interface AdminRow {
  id: number;
  username: string;
  permissions: Permission[];
  active: boolean;
  created_at: string;
  last_login: string | null;
  twoFactor: boolean;
}

export interface CurrentAdmin {
  id: number; // 0 — владелец
  username: string;
  isOwner: boolean;
  permissions: Set<Permission>;
  twoFactor: boolean;
}

// ---------- пароли (scrypt) ----------
export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// ---------- CRUD ----------
type Raw = { id: number; username: string; password_hash: string; permissions: string; active: number; created_at: string; last_login: string | null; totp_enabled?: number };

function toRow(r: Raw): AdminRow {
  let perms: unknown = [];
  try {
    perms = JSON.parse(r.permissions);
  } catch {}
  return { id: r.id, username: r.username, permissions: sanitizePermissions(perms), active: !!r.active, created_at: r.created_at, last_login: r.last_login, twoFactor: !!r.totp_enabled };
}

export function listAdmins(): AdminRow[] {
  return (getDb().prepare("SELECT * FROM admins ORDER BY id").all() as unknown as Raw[]).map(toRow);
}

export function getAdmin(id: number): AdminRow | null {
  const r = getDb().prepare("SELECT * FROM admins WHERE id = ?").get(id) as unknown as Raw | undefined;
  return r ? toRow(r) : null;
}

export function ownerUsername() {
  return process.env.ADMIN_USER || "admin";
}

export function validateUsername(u: string) {
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(u)) return "Логин: 3–32 символа, латиница, цифры, точка, дефис";
  if (u.toLowerCase() === ownerUsername().toLowerCase()) return "Этот логин занят владельцем";
  return null;
}

export function validatePassword(p: string) {
  if (p.length < 10) return "Пароль — минимум 10 символов";
  if (!/[A-Za-zА-Яа-я]/.test(p) || !/\d/.test(p)) return "В пароле нужны и буквы, и цифры";
  if (p.length > 200) return "Пароль слишком длинный";
  return null;
}

export function createAdmin(username: string, password: string, permissions: Permission[]) {
  const res = getDb()
    .prepare("INSERT INTO admins (username, password_hash, permissions) VALUES (?, ?, ?)")
    .run(username, hashPassword(password), JSON.stringify(permissions));
  return Number(res.lastInsertRowid);
}

export function updateAdmin(id: number, data: { permissions?: Permission[]; active?: boolean; password?: string }) {
  const db = getDb();
  if (data.permissions) db.prepare("UPDATE admins SET permissions = ? WHERE id = ?").run(JSON.stringify(data.permissions), id);
  if (data.active !== undefined) db.prepare("UPDATE admins SET active = ? WHERE id = ?").run(data.active ? 1 : 0, id);
  if (data.password) db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(hashPassword(data.password), id);
}

export function deleteAdmin(id: number) {
  getDb().prepare("DELETE FROM admins WHERE id = ?").run(id);
}

/** Проверка логина и пароля дополнительного админа (вход ещё не завершён — возможно, нужен код 2FA). */
export function verifyAdminPassword(username: string, password: string): AdminRow | null {
  const r = getDb().prepare("SELECT * FROM admins WHERE username = ? COLLATE NOCASE").get(username) as unknown as Raw | undefined;
  // Хеш считаем всегда, чтобы по времени ответа нельзя было отличить «нет такого логина» от «неверный пароль»
  const ok = verifyPassword(password, r?.password_hash ?? DUMMY_HASH);
  if (!r || !r.active || !ok) return null;
  return toRow(r);
}
const DUMMY_HASH = hashPassword("dummy-password-for-timing");

export function markLogin(id: number) {
  if (id) getDb().prepare("UPDATE admins SET last_login = datetime('now') WHERE id = ?").run(id);
}

// ---------- двухфакторная защита ----------
export interface TwoFactorState {
  enabled: boolean;
  /** расшифрованный секрет; null — нет или не удалось расшифровать */
  secret: string | null;
  recoveryHashes: string[];
}

export function getTwoFactor(id: number): TwoFactorState {
  if (id === 0) {
    const enc = getSetting("owner_totp_secret");
    let rec: string[] = [];
    try {
      rec = JSON.parse(getSetting("owner_recovery_codes") || "[]");
    } catch {}
    return { enabled: getSetting("owner_totp_enabled") === "1" && !!enc, secret: enc ? decryptSecret(enc) : null, recoveryHashes: rec };
  }
  const r = getDb().prepare("SELECT totp_secret, totp_enabled, recovery_codes FROM admins WHERE id = ?").get(id) as { totp_secret: string; totp_enabled: number; recovery_codes: string } | undefined;
  if (!r) return { enabled: false, secret: null, recoveryHashes: [] };
  let rec: string[] = [];
  try {
    rec = JSON.parse(r.recovery_codes || "[]");
  } catch {}
  return { enabled: !!r.totp_enabled && !!r.totp_secret, secret: r.totp_secret ? decryptSecret(r.totp_secret) : null, recoveryHashes: rec };
}

/** Сохраняет секрет (ещё не включённый — ждёт подтверждения кодом) */
export function stageTwoFactorSecret(id: number, secret: string) {
  const enc = encryptSecret(secret);
  if (id === 0) {
    setSetting("owner_totp_secret", enc);
    setSetting("owner_totp_enabled", "0");
  } else getDb().prepare("UPDATE admins SET totp_secret = ?, totp_enabled = 0 WHERE id = ?").run(enc, id);
}

/** Включает 2FA и возвращает резервные коды (показываются один раз) */
export function enableTwoFactor(id: number): string[] {
  const codes = generateRecoveryCodes();
  const hashes = JSON.stringify(codes.map(hashRecovery));
  if (id === 0) {
    setSetting("owner_totp_enabled", "1");
    setSetting("owner_recovery_codes", hashes);
  } else getDb().prepare("UPDATE admins SET totp_enabled = 1, recovery_codes = ? WHERE id = ?").run(hashes, id);
  return codes;
}

export function regenerateRecoveryCodes(id: number): string[] {
  const codes = generateRecoveryCodes();
  const hashes = JSON.stringify(codes.map(hashRecovery));
  if (id === 0) setSetting("owner_recovery_codes", hashes);
  else getDb().prepare("UPDATE admins SET recovery_codes = ? WHERE id = ?").run(hashes, id);
  return codes;
}

export function disableTwoFactor(id: number) {
  if (id === 0) {
    deleteSetting("owner_totp_secret");
    deleteSetting("owner_totp_enabled");
    deleteSetting("owner_recovery_codes");
  } else getDb().prepare("UPDATE admins SET totp_secret = '', totp_enabled = 0, recovery_codes = '[]' WHERE id = ?").run(id);
  deleteSetting(`totp_last:${id}`);
}

/** Использует резервный код (одноразовый). true — код верный. */
export function consumeRecoveryCode(id: number, code: string): boolean {
  const h = hashRecovery(code);
  const st = getTwoFactor(id);
  if (!st.recoveryHashes.includes(h)) return false;
  const rest = JSON.stringify(st.recoveryHashes.filter((x) => x !== h));
  if (id === 0) setSetting("owner_recovery_codes", rest);
  else getDb().prepare("UPDATE admins SET recovery_codes = ? WHERE id = ?").run(rest, id);
  return true;
}

export const getLastTotpStep = (id: number) => Number(getSetting(`totp_last:${id}`) || 0);
export const setLastTotpStep = (id: number, step: number) => setSetting(`totp_last:${id}`, String(step));

// ---------- сессии ----------
/** «Выйти везде»: все сессии этого человека, выданные раньше этого момента, перестают работать */
export function revokeSessions(id: number) {
  setSetting(`sva:${id}`, String(Date.now()));
}
const sessionsValidAfter = (id: number) => Number(getSetting(`sva:${id}`) || 0);

export function changeOwnPassword(id: number, current: string, next: string): string | null {
  const r = getDb().prepare("SELECT password_hash FROM admins WHERE id = ?").get(id) as { password_hash: string } | undefined;
  if (!r || !verifyPassword(current, r.password_hash)) return "Текущий пароль неверный";
  const err = validatePassword(next);
  if (err) return err;
  updateAdmin(id, { password: next });
  revokeSessions(id);
  return null;
}

// ---------- текущий пользователь ----------
/** Текущий администратор по cookie сессии. Права читаются из БД при каждом запросе — отзыв доступа действует сразу. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const id = session.id ?? 0;
  if ((session.iat ?? 0) < sessionsValidAfter(id)) return null; // сессия завершена («Выйти везде», смена пароля)
  if (!id) {
    if (session.u !== ownerUsername()) return null;
    return { id: 0, username: session.u, isOwner: true, permissions: new Set(ALL_PERMISSIONS), twoFactor: getTwoFactor(0).enabled };
  }
  const a = getAdmin(id);
  if (!a || !a.active || a.username !== session.u) return null;
  return { id: a.id, username: a.username, isOwner: false, permissions: new Set(a.permissions), twoFactor: getTwoFactor(a.id).enabled };
}

export function can(admin: CurrentAdmin | null, perm: Permission) {
  return !!admin && admin.permissions.has(perm);
}
