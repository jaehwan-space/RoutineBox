import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";

const app = createApp();
const email = `auth-${Date.now()}@test.local`;
const password = "password123";

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe("인증 흐름", () => {
  const agent = request.agent(app);

  it("회원가입: 201, 쿠키 발급, 비밀번호 미노출", async () => {
    const res = await agent.post("/auth/register").send({ email, password, name: "테스터" });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email, name: "테스터", role: "USER", providers: [] });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("access_token=") && c.includes("HttpOnly"))).toBe(true);
    expect(cookies.some((c) => c.startsWith("refresh_token="))).toBe(true);
  });

  it("중복 이메일 가입: 409 CONFLICT", async () => {
    const res = await request(app).post("/auth/register").send({ email, password, name: "중복" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("검증 실패: 400 VALIDATION_ERROR (짧은 비밀번호)", async () => {
    const res = await request(app).post("/auth/register").send({ email: "x@test.local", password: "short", name: "a" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.password).toBeDefined();
  });

  it("내 정보: 쿠키로 인증되어 200", async () => {
    const res = await agent.get("/me");
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
  });

  it("비로그인 /me: 401", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
  });

  it("잘못된 비밀번호 로그인: 401", async () => {
    const res = await request(app).post("/auth/login").send({ email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("로그인 → 재발급(회전) → 이전 리프레시 토큰은 무효", async () => {
    const a = request.agent(app);
    const login = await a.post("/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    const oldRefresh = (login.headers["set-cookie"] as unknown as string[]).find((c) => c.startsWith("refresh_token="))!;
    const refreshed = await a.post("/auth/refresh");
    expect(refreshed.status).toBe(200);
    const reuse = await request(app).post("/auth/refresh").set("Cookie", oldRefresh.split(";")[0]!);
    expect(reuse.status).toBe(401);
  });

  it("로그아웃: 204, 이후 /me 는 401 (쿠키 삭제)", async () => {
    const a = request.agent(app);
    await a.post("/auth/login").send({ email, password });
    const out = await a.post("/auth/logout");
    expect(out.status).toBe(204);
    const me = await a.get("/me");
    expect(me.status).toBe(401);
  });
});
