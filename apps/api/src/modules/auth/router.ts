import { Router } from "express";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@routinebox/shared";
import { getAuth, requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { clearAuthCookies, readCookie, REFRESH_COOKIE, setAuthCookies } from "./cookies.js";
import * as auth from "./service.js";

export const authRouter = Router();

authRouter.post("/auth/register", validate(registerSchema), async (_req, res) => {
  const { user, session } = await auth.register(res.locals.body as RegisterInput);
  setAuthCookies(res, session.access, session.refresh, session.refreshExpiresAt);
  res.status(201).json({ data: user });
});

authRouter.post("/auth/login", validate(loginSchema), async (_req, res) => {
  const { user, session } = await auth.login(res.locals.body as LoginInput);
  setAuthCookies(res, session.access, session.refresh, session.refreshExpiresAt);
  res.json({ data: user });
});

authRouter.post("/auth/refresh", async (req, res) => {
  const raw = readCookie(req, REFRESH_COOKIE);
  if (!raw) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } });
    return;
  }
  try {
    const { user, session } = await auth.refresh(raw);
    setAuthCookies(res, session.access, session.refresh, session.refreshExpiresAt);
    res.json({ data: user });
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }
});

authRouter.post("/auth/logout", async (req, res) => {
  await auth.logout(readCookie(req, REFRESH_COOKIE));
  clearAuthCookies(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  res.json({ data: await auth.getMe(getAuth(res).userId) });
});
