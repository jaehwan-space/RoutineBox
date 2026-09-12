import type { AuthProvider } from "@routinebox/shared";
import { config } from "../../config.js";
import { AppError } from "../../lib/errors.js";

export interface OAuthProfile { provider: AuthProvider; providerId: string; email: string | null; name: string }

interface ProviderSpec {
  authorizeUrl: string;
  tokenUrl: string;
  profileUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  parseProfile: (raw: unknown) => Omit<OAuthProfile, "provider">;
}

const specs: Record<AuthProvider, ProviderSpec> = {
  KAKAO: {
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
    profileUrl: "https://kapi.kakao.com/v2/user/me",
    scope: "profile_nickname account_email",
    clientId: config.KAKAO_CLIENT_ID,
    clientSecret: config.KAKAO_CLIENT_SECRET,
    redirectUri: config.KAKAO_REDIRECT_URI,
    parseProfile: (raw) => {
      const r = raw as { id: number; kakao_account?: { email?: string; profile?: { nickname?: string } } };
      return { providerId: String(r.id), email: r.kakao_account?.email ?? null, name: r.kakao_account?.profile?.nickname ?? "카카오 사용자" };
    },
  },
  GOOGLE: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid email profile",
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    redirectUri: config.GOOGLE_REDIRECT_URI,
    parseProfile: (raw) => {
      const r = raw as { sub: string; email?: string; name?: string };
      return { providerId: r.sub, email: r.email ?? null, name: r.name ?? "구글 사용자" };
    },
  },
};

export function parseProvider(value: string): AuthProvider {
  const upper = value.toUpperCase();
  if (upper === "KAKAO" || upper === "GOOGLE") return upper;
  throw new AppError("NOT_FOUND", "지원하지 않는 로그인 제공자입니다.");
}

function getSpec(provider: AuthProvider): Required<ProviderSpec> {
  const spec = specs[provider];
  if (!spec.clientId || !spec.redirectUri) {
    throw new AppError("INTERNAL", `${provider} 로그인이 설정되지 않았습니다. 환경 변수를 확인하세요.`);
  }
  return { ...spec, clientId: spec.clientId, clientSecret: spec.clientSecret ?? "", redirectUri: spec.redirectUri };
}

export function isConfigured(provider: AuthProvider): boolean {
  const spec = specs[provider];
  return Boolean(spec.clientId && spec.redirectUri);
}

export function buildAuthorizeUrl(provider: AuthProvider, state: string): string {
  const spec = getSpec(provider);
  const url = new URL(spec.authorizeUrl);
  url.searchParams.set("client_id", spec.clientId);
  url.searchParams.set("redirect_uri", spec.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", spec.scope);
  url.searchParams.set("state", state);
  if (provider === "GOOGLE") url.searchParams.set("access_type", "online");
  return url.toString();
}

/** 인가 코드 → 액세스 토큰 → 프로필 */
export async function fetchProfile(provider: AuthProvider, code: string): Promise<OAuthProfile> {
  const spec = getSpec(provider);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: spec.clientId,
    redirect_uri: spec.redirectUri,
    code,
  });
  if (spec.clientSecret) body.set("client_secret", spec.clientSecret);

  const tokenRes = await fetch(spec.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new AppError("UNAUTHORIZED", `${provider} 토큰 교환에 실패했습니다.`, await tokenRes.text());
  const token = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch(spec.profileUrl, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!profileRes.ok) throw new AppError("UNAUTHORIZED", `${provider} 프로필 조회에 실패했습니다.`);
  return { provider, ...spec.parseProfile(await profileRes.json()) };
}
