import "server-only";
import crypto from "node:crypto";

/** Двухфакторная защита: коды из приложения-аутентификатора (Google Authenticator, Authy, 1Password…), RFC 6238 (TOTP). */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of str.toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const generateTotpSecret = () => base32Encode(crypto.randomBytes(20));

export function totpAt(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const off = h[h.length - 1] & 0xf;
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

/** Проверяет 6-значный код (допускаем соседние 30-секундные окна — расхождение часов). Нельзя использовать один код дважды: передайте lastStep. */
export function verifyTotp(secret: string, code: string, lastStep = 0, now = Date.now()): { ok: boolean; step: number } {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return { ok: false, step: 0 };
  const current = Math.floor(now / 30_000);
  for (const d of [0, -1, 1]) {
    const step = current + d;
    if (step <= lastStep) continue;
    const expected = Buffer.from(totpAt(secret, step));
    if (crypto.timingSafeEqual(expected, Buffer.from(clean))) return { ok: true, step };
  }
  return { ok: false, step: 0 };
}

export function otpauthUri(secret: string, account: string, issuer: string) {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ---------- шифрование секрета в базе (AES-256-GCM, ключ из SESSION_SECRET) ----------
function key() {
  return crypto.createHash("sha256").update(`totp-secret:${process.env.SESSION_SECRET || "dev-insecure-secret-change-me"}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
}

/** null — если расшифровать нельзя (например, сменили SESSION_SECRET) */
export function decryptSecret(stored: string): string | null {
  try {
    const [v, iv, tag, data] = stored.split(".");
    if (v !== "v1") return null;
    const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// ---------- резервные коды (на случай потери телефона) ----------
export function generateRecoveryCodes(n = 10): string[] {
  return Array.from({ length: n }, () => {
    const raw = base32Encode(crypto.randomBytes(7)).slice(0, 10).toLowerCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}
export const hashRecovery = (code: string) => crypto.createHash("sha256").update(code.trim().toLowerCase().replace(/\s/g, "")).digest("hex");
