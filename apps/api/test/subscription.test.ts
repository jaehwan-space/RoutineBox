import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, todayKst } from "@routinebox/shared";
import { createApp } from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";

const app = createApp();
const tag = `sub${Date.now()}`;
const email = `${tag}@test.local`;
const otherEmail = `${tag}-other@test.local`;
let productId = "";
let paymentMethodId = "";
const agent = request.agent(app);
const other = request.agent(app);
const firstDelivery = addDays(todayKst(), 5);

beforeAll(async () => {
  const p = await prisma.product.create({ data: { name: `${tag} 세제`, category: "DETERGENT", price: 10000, recommendedCycleDays: 28, stock: 5 } });
  productId = p.id;
  await agent.post("/auth/register").send({ email, password: "password123", name: "구독자" });
  await other.post("/auth/register").send({ email: otherEmail, password: "password123", name: "타인" });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const pm = await prisma.paymentMethod.create({ data: { userId: user.id, customerKey: `cust_${user.id}`, billingKeyEnc: "enc", cardCompany: "MOCK", cardLast4: "0000" } });
  paymentMethodId = pm.id;
});
afterAll(async () => {
  // 구독·주문은 사용자·상품을 Restrict 로 참조하므로 자식부터 지운다.
  const users = await prisma.user.findMany({ where: { email: { in: [email, otherEmail] } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.order.deleteMany({ where: { userId: { in: ids } } });
  await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });
  await prisma.paymentMethod.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe("구독 API", () => {
  let pendingId = "";
  let activeId = "";

  it("결제수단 없이 생성 → PENDING, 다음 결제일 = 배송일 − 3", async () => {
    const res = await agent.post("/subscriptions").send({ productId, quantity: 2, cycleDays: 28, firstDeliveryDate: firstDelivery });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: "PENDING", amount: 19000, nextBillingDate: addDays(firstDelivery, -3), nextDeliveryDate: firstDelivery, paymentMethod: null });
    pendingId = res.body.data.id;
  });

  it("너무 이른 첫 배송일은 400", async () => {
    const res = await agent.post("/subscriptions").send({ productId, quantity: 1, cycleDays: 28, firstDeliveryDate: todayKst() });
    expect(res.status).toBe(400);
  });

  it("activate → ACTIVE (결제수단 연결)", async () => {
    const res = await agent.post(`/subscriptions/${pendingId}/activate`).send({ paymentMethodId });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: "ACTIVE", paymentMethod: { cardLast4: "0000" } });
    activeId = pendingId;
  });

  it("결제수단과 함께 생성 → 바로 ACTIVE", async () => {
    const res = await agent.post("/subscriptions").send({ productId, quantity: 1, cycleDays: 14, firstDeliveryDate: firstDelivery, paymentMethodId });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("ACTIVE");
  });

  it("건너뛰기 → 다음 결제일 + 주기", async () => {
    const before = (await agent.get(`/subscriptions/${activeId}`)).body.data.nextBillingDate as string;
    const res = await agent.post(`/subscriptions/${activeId}/skip`);
    expect(res.body.data.nextBillingDate).toBe(addDays(before, 28));
  });

  it("주기·수량 변경 → 금액 재계산", async () => {
    const res = await agent.patch(`/subscriptions/${activeId}`).send({ quantity: 3, cycleDays: 42 });
    expect(res.body.data).toMatchObject({ quantity: 3, cycleDays: 42, amount: 28500 });
  });

  it("일시정지 → 건너뛰기는 409 → 재개", async () => {
    expect((await agent.post(`/subscriptions/${activeId}/pause`)).body.data.status).toBe("PAUSED");
    const bad = await agent.post(`/subscriptions/${activeId}/skip`);
    expect(bad.status).toBe(409);
    expect(bad.body.error.code).toBe("INVALID_TRANSITION");
    const res = await agent.post(`/subscriptions/${activeId}/resume`).send({});
    expect(res.body.data).toMatchObject({ status: "ACTIVE", nextBillingDate: addDays(todayKst(), 3) });
  });

  it("목록: 이번 달 예정 결제 합계와 활성 수", async () => {
    const res = await agent.get("/subscriptions");
    expect(res.status).toBe(200);
    expect(res.body.data.activeCount).toBe(2);
    expect(typeof res.body.data.monthlyDue).toBe("number");
  });

  it("타인의 구독은 404", async () => {
    expect((await other.get(`/subscriptions/${activeId}`)).status).toBe(404);
    expect((await other.post(`/subscriptions/${activeId}/cancel`)).status).toBe(404);
  });

  it("해지 → CANCELLED, 이후 재개 409", async () => {
    expect((await agent.post(`/subscriptions/${activeId}/cancel`)).body.data.status).toBe("CANCELLED");
    expect((await agent.post(`/subscriptions/${activeId}/resume`).send({})).status).toBe(409);
    const notes = await prisma.notification.count({ where: { subscriptionId: activeId, type: "CANCELLED" } });
    expect(notes).toBe(1);
  });
});
