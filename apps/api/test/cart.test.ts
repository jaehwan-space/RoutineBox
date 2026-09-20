import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, todayKst, type SubscriptionDto } from "@routinebox/shared";
import { createApp } from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";

const app = createApp();
const tag = `cart${Date.now()}`;
const email = `${tag}@test.local`;
let productId = "";
let waterId = "";
let soldOutId = "";
const firstDelivery = addDays(todayKst(), 5);

beforeAll(async () => {
  const p = await prisma.product.create({ data: { name: `${tag} 세제`, category: "DETERGENT", price: 10000, recommendedCycleDays: 28, stock: 5 } });
  productId = p.id;
  const w = await prisma.product.create({ data: { name: `${tag} 생수`, category: "WATER", price: 8000, recommendedCycleDays: 14, stock: 5 } });
  waterId = w.id;
  const s = await prisma.product.create({ data: { name: `${tag} 품절`, category: "TISSUE", price: 5000, recommendedCycleDays: 28, stock: 0 } });
  soldOutId = s.id;
});
afterAll(async () => {
  // 구독은 사용자·상품을 Restrict 로 참조하므로 자식부터 지운다.
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.paymentMethod.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe("장바구니 API", () => {
  const agent = request.agent(app);

  it("비로그인은 401", async () => {
    expect((await request(app).get("/cart")).status).toBe(401);
  });

  it("담기 → 수량 변경 → 합계", async () => {
    await agent.post("/auth/register").send({ email, password: "password123", name: "장바구니" });
    let res = await agent.put("/cart/items").send({ productId, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.itemCount).toBe(2);
    expect(res.body.data.total).toBe(9500 * 2); // 10000 × 0.95 = 9500
    res = await agent.put("/cart/items").send({ productId, quantity: 3 });
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(3);
  });

  it("없는 상품은 404, 수량 0은 400", async () => {
    expect((await agent.put("/cart/items").send({ productId: "nope", quantity: 1 })).status).toBe(404);
    expect((await agent.put("/cart/items").send({ productId, quantity: 0 })).status).toBe(400);
  });

  it("삭제 후 빈 장바구니", async () => {
    const res = await agent.delete(`/cart/items/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});

describe("장바구니 일괄 구독 시작 POST /cart/checkout", () => {
  const agent = request.agent(app);
  const login = () => agent.post("/auth/login").send({ email, password: "password123" });

  it("비로그인은 401, 빈 장바구니는 400", async () => {
    expect((await request(app).post("/cart/checkout").send({ firstDeliveryDate: firstDelivery })).status).toBe(401);
    await login();
    const res = await agent.post("/cart/checkout").send({ firstDeliveryDate: firstDelivery });
    expect(res.status).toBe(400);
  });

  it("상품마다 구독을 만들고(수량은 장바구니 값, 주기는 지정값 없으면 추천 주기) 장바구니를 비운다", async () => {
    await agent.put("/cart/items").send({ productId, quantity: 2 });
    await agent.put("/cart/items").send({ productId: waterId, quantity: 1 });
    const res = await agent.post("/cart/checkout").send({ firstDeliveryDate: firstDelivery, cycles: [{ productId, cycleDays: 42 }] });
    expect(res.status).toBe(201);
    const subs = res.body.data.subscriptions as SubscriptionDto[];
    expect(subs).toHaveLength(2);
    expect(subs.find((s) => s.product.id === productId)).toMatchObject({ status: "PENDING", quantity: 2, cycleDays: 42, amount: 19000, nextBillingDate: addDays(firstDelivery, -3), paymentMethod: null });
    expect(subs.find((s) => s.product.id === waterId)).toMatchObject({ status: "PENDING", quantity: 1, cycleDays: 14, amount: 7600 });
    expect(res.body.data.cart.items).toHaveLength(0);
    expect((await agent.get("/cart")).body.data.itemCount).toBe(0);
    expect((await agent.get("/subscriptions")).body.data.items).toHaveLength(2);
  });

  it("너무 이른 첫 배송일은 400 이고 아무것도 만들지 않는다", async () => {
    await agent.put("/cart/items").send({ productId, quantity: 1 });
    const res = await agent.post("/cart/checkout").send({ firstDeliveryDate: todayKst() });
    expect(res.status).toBe(400);
    expect((await agent.get("/cart")).body.data.itemCount).toBe(1);
    expect((await agent.get("/subscriptions")).body.data.items).toHaveLength(2);
  });

  it("품절 상품이 섞여 있으면 409 이고 아무것도 만들지 않는다", async () => {
    await agent.put("/cart/items").send({ productId: soldOutId, quantity: 1 });
    const res = await agent.post("/cart/checkout").send({ firstDeliveryDate: firstDelivery });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain("품절");
    expect((await agent.get("/cart")).body.data.items).toHaveLength(2);
    expect((await agent.get("/subscriptions")).body.data.items).toHaveLength(2);
  });

  it("결제수단과 함께 시작 → 모두 ACTIVE, 구독 시작 알림 기록", async () => {
    await agent.delete(`/cart/items/${soldOutId}`);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const pm = await prisma.paymentMethod.create({ data: { userId: user.id, customerKey: `cust_${user.id}`, billingKeyEnc: "enc", cardCompany: "MOCK", cardLast4: "0000" } });
    const res = await agent.post("/cart/checkout").send({ firstDeliveryDate: firstDelivery, paymentMethodId: pm.id });
    expect(res.status).toBe(201);
    const subs = res.body.data.subscriptions as SubscriptionDto[];
    expect(subs).toHaveLength(1);
    const sub = subs[0] as SubscriptionDto;
    expect(sub).toMatchObject({ status: "ACTIVE", quantity: 1, cycleDays: 28, paymentMethod: { cardLast4: "0000" } });
    expect(await prisma.notification.count({ where: { subscriptionId: sub.id, type: "SUBSCRIPTION_STARTED" } })).toBe(1);
    expect((await agent.get("/cart")).body.data.itemCount).toBe(0);
  });

  it("타인의 결제수단은 404", async () => {
    await agent.put("/cart/items").send({ productId, quantity: 1 });
    const res = await agent.post("/cart/checkout").send({ firstDeliveryDate: firstDelivery, paymentMethodId: "not-mine" });
    expect(res.status).toBe(404);
    expect((await agent.get("/cart")).body.data.itemCount).toBe(1);
  });
});
