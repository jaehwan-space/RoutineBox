import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, todayKst } from "@routinebox/shared";
import { createApp } from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";
import { decryptSecret, encryptSecret } from "../src/lib/crypto.ts";

const app = createApp();
const tag = `pm${Date.now()}`;
const email = `${tag}@test.local`;
const agent = request.agent(app);
let productId = "";

beforeAll(async () => {
  await agent.post("/auth/register").send({ email, password: "password123", name: "카드" });
  const p = await prisma.product.create({ data: { name: `${tag} 생수`, category: "WATER", price: 9900, recommendedCycleDays: 14, stock: 9 } });
  productId = p.id;
});
afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.paymentMethod.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe("빌링키 암호화", () => {
  it("암호화 → 복호화 왕복, 매번 다른 암호문", () => {
    const a = encryptSecret("billing_key_123");
    const b = encryptSecret("billing_key_123");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe("billing_key_123");
  });
});

describe("결제수단 API", () => {
  let pmId = "";
  it("모의 결제수단 등록 (PAYMENTS_MOCK)", async () => {
    const res = await agent.post("/payment-methods/mock");
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ cardCompany: "테스트카드", cardLast4: "0000" });
    pmId = res.body.data.id;
    const stored = await prisma.paymentMethod.findUniqueOrThrow({ where: { id: pmId } });
    expect(stored.billingKeyEnc).not.toContain("mock_");
  });
  it("목록 조회", async () => {
    const res = await agent.get("/payment-methods");
    expect(res.body.data).toHaveLength(1);
  });
  it("billing-auth: customerKey 불일치는 400", async () => {
    const res = await agent.post("/payment-methods/billing-auth").send({ authKey: "x", customerKey: "cust_other" });
    expect(res.status).toBe(400);
  });
  it("활성 구독이 쓰는 카드는 삭제 409, 해지 후 삭제 204", async () => {
    const sub = await agent.post("/subscriptions").send({ productId, quantity: 1, cycleDays: 14, firstDeliveryDate: addDays(todayKst(), 4), paymentMethodId: pmId });
    expect(sub.body.data.status).toBe("ACTIVE");
    expect((await agent.delete(`/payment-methods/${pmId}`)).status).toBe(409);
    await agent.post(`/subscriptions/${sub.body.data.id}/cancel`);
    expect((await agent.delete(`/payment-methods/${pmId}`)).status).toBe(204);
    expect((await agent.get("/payment-methods")).body.data).toHaveLength(0);
  });
});
