import type { LoginInput, RegisterInput, UserDto } from "@routinebox/shared";
import { api } from "@/lib/api";

export const authApi = {
  me: () => api<UserDto>("/me"),
  refresh: () => api<UserDto>("/auth/refresh", { method: "POST" }),
  register: (input: RegisterInput) => api<UserDto>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: LoginInput) => api<UserDto>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
};

/** 소셜 로그인 시작 URL (Next rewrite → API → 제공자 인가 페이지) */
export const socialLoginUrl = (provider: "kakao" | "google") =>
  `${process.env.NEXT_PUBLIC_API_BASE ?? "/api"}/auth/${provider}`;
