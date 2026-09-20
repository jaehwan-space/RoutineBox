import type { ApiErrorBody } from "@routinebox/shared";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

/** 브라우저·서버 공용 fetch 래퍼. 쿠키 인증을 위해 credentials: include. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { data?: T } | ApiErrorBody | null;
  if (!res.ok) {
    const err = body && "error" in body ? body.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return (body as { data: T }).data;
}
