import { randomBytes } from "node:crypto";
import { Router } from "express";
import { config } from "../../config.js";
import { readCookie, setAuthCookies } from "./cookies.js";
import { buildAuthorizeUrl, fetchProfile, isConfigured, parseProvider } from "./oauth-providers.js";
import { loginWithOAuth } from "./service.js";

export const oauthRouter = Router();
const STATE_COOKIE = "oauth_state";
const stateCookie = { httpOnly: true, sameSite: "lax" as const, secure: config.COOKIE_SECURE, path: "/", maxAge: 10 * 60 * 1000 };

/** 1단계: 제공자 인가 페이지로 리다이렉트 (CSRF 방지용 state 쿠키) */
oauthRouter.get("/auth/:provider", (req, res) => {
  const provider = parseProvider(String(req.params.provider));
  if (!isConfigured(provider)) {
    res.status(503).json({ error: { code: "INTERNAL", message: `${provider} 로그인이 아직 설정되지 않았습니다.` } });
    return;
  }
  const state = randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, stateCookie);
  res.redirect(buildAuthorizeUrl(provider, state));
});

/** 2단계: 콜백 — state 검증, 코드 교환, 계정 연결, 쿠키 발급 후 앱으로 복귀 */
oauthRouter.get("/auth/:provider/callback", async (req, res) => {
  const provider = parseProvider(String(req.params.provider));
  const { code, state, error } = req.query as Record<string, string | undefined>;
  const expected = readCookie(req, STATE_COOKIE);
  res.clearCookie(STATE_COOKIE, { path: "/" });

  if (error || !code || !state || !expected || state !== expected) {
    res.redirect(`${config.APP_URL}/login?error=oauth_state`);
    return;
  }
  try {
    const { session } = await loginWithOAuth(await fetchProfile(provider, code));
    setAuthCookies(res, session.access, session.refresh, session.refreshExpiresAt);
    res.redirect(`${config.APP_URL}/`);
  } catch (err) {
    console.error(`[oauth:${provider}]`, err);
    res.redirect(`${config.APP_URL}/login?error=oauth_failed`);
  }
});
