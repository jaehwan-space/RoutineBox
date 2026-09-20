import type { CookieOptions, Request, Response } from "express";
import { config } from "../../config.js";
import { ttlToMs } from "./tokens.js";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const base: CookieOptions = { httpOnly: true, sameSite: "lax", secure: config.COOKIE_SECURE, path: "/" };

export function setAuthCookies(res: Response, access: string, refresh: string, refreshExpiresAt: Date) {
  res.cookie(ACCESS_COOKIE, access, { ...base, maxAge: ttlToMs(config.JWT_ACCESS_TTL) });
  res.cookie(REFRESH_COOKIE, refresh, { ...base, expires: refreshExpiresAt });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

export function readCookie(req: Request, name: string): string | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[name];
}
