import { createHash, randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@routinebox/shared";
import { config } from "../../config.js";

export interface AccessPayload { sub: string; role: Role }

/** "15m" | "14d" | "3600" → 밀리초 */
export function ttlToMs(ttl: string): number {
  const m = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!m) throw new Error(`잘못된 TTL 형식: ${ttl}`);
  const n = Number(m[1]);
  const unit = m[2] ?? "s";
  return n * { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
}

export function signAccessToken(user: { id: string; role: Role }): string {
  return jwt.sign({ role: user.role }, config.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: config.JWT_ACCESS_TTL as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** 리프레시 토큰은 무작위 문자열이며 DB에는 SHA-256 해시만 저장한다. */
export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(48).toString("base64url");
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + ttlToMs(config.JWT_REFRESH_TTL)) };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
