import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";

describe("GET /health", () => {
  it("응답 형식이 { data: { status, db, time } } 이다", async () => {
    const res = await request(createApp()).get("/health");
    expect([200, 503]).toContain(res.status);
    expect(res.body.data).toMatchObject({ status: expect.any(String), db: expect.any(String) });
  });
  it("없는 경로는 404 NOT_FOUND 이다", async () => {
    const res = await request(createApp()).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
