import type { ApiErrorBody } from "@routinebox/shared";
import { ApiError } from "./api";

// 서버 컴포넌트 전용: API 컨테이너에 직접 호출한다(브라우저는 /api 리라이트를 쓴다).
const BASE = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, cache: "no-store" });
  const body = (await res.json().catch(() => null)) as { data?: T } | ApiErrorBody | null;
  if (!res.ok) {
    const err = body && "error" in body ? body.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return (body as { data: T }).data;
}

/** 404 는 null 로 돌려주는 변형 (notFound() 처리용) */
export async function serverApiOrNull<T>(path: string): Promise<T | null> {
  try {
    return await serverApi<T>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
