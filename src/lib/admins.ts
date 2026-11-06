import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { ALL_PERMISSIONS, sanitizePermissions, type Permission } from "@/admin/permissions";

export interface AdminRow {
  id: number;
  username: string;
  permissions: Permission[];
  active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface CurrentAdmin {
  id: number; // 0 — владелец
  username: string;
  isOwner: boolean;
  permissions: Set<Permission>;
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
type Raw = { id: number; username: string; password_hash: string; permissions: string; active: number; created_at: string; last_login: string | null };

function toRow(r: Raw): AdminRow {
  let perms: unknown = [];
  try {
    perms = JSON.parse(r.permissions);
  } catch {}
  return { id: r.id, username: r.username, permissions: sanitizePermissions(perms), active: !!r.active, created_at: r.created_at, last_login: r.last_login };
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
  return p.length >= 8 ? null : "Пароль — минимум 8 символов";
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

/** Проверка логина для дополнительных админов. */
export function authenticateAdmin(username: string, password: string): AdminRow | null {
  const r = getDb().prepare("SELECT * FROM admins WHERE username = ? COLLATE NOCASE").get(username) as unknown as Raw | undefined;
  if (!r || !r.active || !verifyPassword(password, r.password_hash)) return null;
  getDb().prepare("UPDATE admins SET last_login = datetime('now') WHERE id = ?").run(r.id);
  return toRow(r);
}

// ---------- текущий пользователь ----------
/** Текущий администратор по cookie сессии. Права читаются из БД при каждом запросе — отзыв доступа действует сразу. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  if (!session.id) {
    if (session.u !== ownerUsername()) return null;
    return { id: 0, username: session.u, isOwner: true, permissions: new Set(ALL_PERMISSIONS) };
  }
  const a = getAdmin(session.id);
  if (!a || !a.active || a.username !== session.u) return null;
  return { id: a.id, username: a.username, isOwner: false, permissions: new Set(a.permissions) };
}

export function can(admin: CurrentAdmin | null, perm: Permission) {
  return !!admin && admin.permissions.has(perm);
}
