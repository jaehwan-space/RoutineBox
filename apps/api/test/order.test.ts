import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, todayKst } from "@routinebox/shared";
import { createApp } from "../src/app.ts";
import { encryptSecret } from "../src/lib/crypto.ts";
import { prisma } from "../src/lib/prisma.ts";
import { runBilling } from "../src/modules/billing/service.ts";

const app = createApp();
const tag = `ord${Date.now()}`;
const email = `${tag}@test.local`;
const otherEmail = `${tag}-other@test.local`;
const agent = request.agent(app);
const other = request.agent(app);
const today = todayKst();
let orderId = "";

beforeAll(async () => {
  await agent.post("/auth/register").send({ email, password: "password123", name: "주문자" });
  await other.post("/auth/register").send({ email: otherEmail, password: "password123", name: "타인" });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const p = await prisma.product.create({ data: { name: `${tag} 생수`, category: "WATER", price: 9900, recommendedCycleDays: 14, stock: 9 } });
  const pm = await prisma.paymentMethod.create({ data: { userId: user.id, customerKey: `cust_${user.id}`, billingKeyEnc: encryptSecret("mock_ok"), cardCompany: "테스트카드", cardLast4: "0000" } });
  const sub = await prisma.subscription.create({ data: { userId: user.id, productId: p.id, paymentMethodId: pm.id, quantity: 1, cycleDays: 14, amount: 9400, status: "ACTIVE", firstDeliveryDate: new Date(`${addDays(today, 3)}T00:00:00Z`), nextBillingDate: new Date(`${today}T00:00:00Z`) } });
  await runBilling();
  orderId = (await prisma.order.findFirstOrThrow({ where: { subscriptionId: sub.id } })).id;
});
afterAll(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: [email, otherEmail] } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.payment.deleteMany({ where: { order: { userId: { in: ids } } } });
  await prisma.order.deleteMany({ where: { userId: { in: ids } } });
  await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });
  await prisma.paymentMethod.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe("주문 API", () => {
  it("내 주문 목록 (상품·구독 정보 포함, 페이지네이션)", async () => {
    const res = await agent.get("/orders");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0]).toMatchObject({ id: orderId, status: "PAID", deliveryStatus: "PREPARING", amount: 9400, cycleDays: 14, product: { name: `${tag} 생수` } });
  });
  it("주문 상세 (결제 결과·카드 정보)", async () => {
    const res = await agent.get(`/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.payment).toMatchObject({ status: "APPROVED", amount: 9400 });
    expect(res.body.data.paymentMethod).toMatchObject({ cardLast4: "0000" });
  });
  it("타인의 주문은 404, 비로그인 401", async () => {
    expect((await other.get(`/orders/${orderId}`)).status).toBe(404);
    expect((await request(app).get("/orders")).status).toBe(401);
  });
  it("알림 이력 조회", async () => {
    const res = await agent.get("/notifications");
    expect(res.status).toBe(200);
    expect(res.body.data.some((n: { type: string }) => n.type === "PAYMENT_SUCCESS")).toBe(true);
    expect(res.body.data[0].productName).toBe(`${tag} 생수`);
  });
});
