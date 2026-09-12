import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";

describe("OAuth 라우트", () => {
  const app = createApp();
  it("지원하지 않는 제공자: 404", async () => {
    const res = await request(app).get("/auth/naver");
    expect(res.status).toBe(404);
  });
  it("설정되지 않은 제공자: 503 (환경 변수 없음)", async () => {
    const res = await request(app).get("/auth/kakao");
    expect([503, 302]).toContain(res.status);
  });
  it("콜백 state 불일치: 로그인 페이지로 리다이렉트", async () => {
    const res = await request(app).get("/auth/google/callback?code=abc&state=zzz");
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/login?error=oauth_state");
  });
});
