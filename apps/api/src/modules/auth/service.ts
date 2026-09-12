import type { AuthProvider, LoginInput, RegisterInput, UserDto } from "@routinebox/shared";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyPassword } from "./password.js";
import { generateRefreshToken, hashToken, signAccessToken } from "./tokens.js";

const userWithAccounts = { include: { oauthAccounts: { select: { provider: true } } } } satisfies Prisma.UserDefaultArgs;
type UserWithAccounts = Prisma.UserGetPayload<typeof userWithAccounts>;

export interface Session { access: string; refresh: string; refreshExpiresAt: Date }

export function toUserDto(user: UserWithAccounts): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    providers: user.oauthAccounts.map((a) => a.provider as AuthProvider),
    createdAt: user.createdAt.toISOString(),
  };
}

/** 리프레시 토큰을 DB에 기록하고 액세스·리프레시 토큰 쌍을 만든다. */
export async function issueSession(user: { id: string; role: UserDto["role"] }): Promise<Session> {
  const { token, hash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hash, expiresAt } });
  return { access: signAccessToken(user), refresh: token, refreshExpiresAt: expiresAt };
}

export async function register(input: RegisterInput): Promise<{ user: UserDto; session: Session }> {
  const email = input.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError("CONFLICT", "이미 가입된 이메일입니다.");
  const user = await prisma.user.create({
    data: { email, name: input.name, passwordHash: await hashPassword(input.password) },
    ...userWithAccounts,
  });
  return { user: toUserDto(user), session: await issueSession(user) };
}

export async function login(input: LoginInput): Promise<{ user: UserDto; session: Session }> {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, ...userWithAccounts });
  if (!user || !user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError("UNAUTHORIZED", "이메일 또는 비밀번호가 올바르지 않습니다.");
  }
  return { user: toUserDto(user), session: await issueSession(user) };
}

/** 리프레시 토큰 회전: 기존 토큰을 폐기하고 새 쌍을 발급한다. */
export async function refresh(rawToken: string): Promise<{ user: UserDto; session: Session }> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: userWithAccounts },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError("UNAUTHORIZED", "세션이 만료되었습니다. 다시 로그인하세요.");
  }
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  return { user: toUserDto(stored.user), session: await issueSession(stored.user) };
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId }, ...userWithAccounts });
  if (!user) throw new AppError("UNAUTHORIZED", "사용자를 찾을 수 없습니다.");
  return toUserDto(user);
}

/**
 * 소셜 로그인: provider+providerId 로 연결된 계정을 찾고, 없으면 같은 이메일의 계정에 연결하거나 새로 만든다.
 */
export async function loginWithOAuth(profile: {
  provider: AuthProvider; providerId: string; email: string | null; name: string;
}): Promise<{ user: UserDto; session: Session }> {
  const linked = await prisma.oAuthAccount.findUnique({
    where: { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
    include: { user: userWithAccounts },
  });
  if (linked) return { user: toUserDto(linked.user), session: await issueSession(linked.user) };

  const email = profile.email?.toLowerCase() ?? `${profile.provider.toLowerCase()}_${profile.providerId}@no-email.routinebox.local`;
  const user = await prisma.user.upsert({
    where: { email },
    update: { oauthAccounts: { create: { provider: profile.provider, providerId: profile.providerId } } },
    create: {
      email,
      name: profile.name,
      oauthAccounts: { create: { provider: profile.provider, providerId: profile.providerId } },
    },
    ...userWithAccounts,
  });
  return { user: toUserDto(user), session: await issueSession(user) };
}
