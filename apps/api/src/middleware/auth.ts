import type { RequestHandler } from "express";
import type { Role } from "@routinebox/shared";
import { AppError } from "../lib/errors.js";
import { ACCESS_COOKIE, readCookie } from "../modules/auth/cookies.js";
import { verifyAccessToken } from "../modules/auth/tokens.js";

export interface AuthContext { userId: string; role: Role }

/** 쿠키(또는 Bearer 헤더)의 액세스 토큰을 검증해 res.locals.auth 에 넣는다. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined;
  const token = readCookie(req, ACCESS_COOKIE) ?? bearer;
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) {
    next(new AppError("UNAUTHORIZED", "로그인이 필요합니다."));
    return;
  }
  (res.locals as { auth?: AuthContext }).auth = { userId: payload.sub, role: payload.role };
  next();
};

export const requireRole = (role: Role): RequestHandler => (_req, res, next) => {
  const auth = (res.locals as { auth?: AuthContext }).auth;
  if (!auth || auth.role !== role) {
    next(new AppError("FORBIDDEN", "권한이 없습니다."));
    return;
  }
  next();
};

export const getAuth = (res: { locals: unknown }): AuthContext => {
  const auth = (res.locals as { auth?: AuthContext }).auth;
  if (!auth) throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.");
  return auth;
};
