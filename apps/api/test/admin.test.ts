import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, todayKst } from "@routinebox/shared";
import { createApp } from "../src/app.ts";
import { encryptSecret } from "../src/lib/crypto.ts";
import { prisma } from "../src/lib/prisma.ts";
import { runBilling } from "../src/modules/billing/service.ts";

const app = createApp();
const tag = `adm${Date.now()}`;
const userEmail = `${tag}-user@test.local`;
const adminEmail = `${tag}-admin@test.local`;
const user = request.agent(app);
const admin = request.agent(app);
const today = todayKst();
let userId = "";
let productId = "";
let paidOrderId = "";
let failedSubId = "";

beforeAll(async () => {
  await user.post("/auth/register").send({ email: userEmail, password: "password123", name: "회원" });
  await admin.post("/auth/register").send({ email: adminEmail, password: "password123", name: "관리자" });
  await prisma.user.update({ where: { email: adminEmail }, data: { role: "ADMIN" } });
  await admin.post("/auth/login").send({ email: adminEmail, password: "password123" });
  userId = (await prisma.user.findUniqueOrThrow({ where: { email: userEmail } })).id;
  const p = await prisma.product.create({ data: { name: `${tag} 세제`, category: "DETERGENT", price: 12000, recommendedCycleDays: 28, stock: 10 } });
  productId = p.id;
  const ok = await prisma.paymentMethod.create({ data: { userId, customerKey: `cust_${userId}`, billingKeyEnc: encryptSecret("mock_ok"), cardCompany: "테스트카드", cardLast4: "0000" } });
  const bad = await prisma.paymentMethod.create({ data: { userId, customerKey: `cust_${userId}`, billingKeyEnc: encryptSecret("mock_fail"), cardCompany: "테스트카드", cardLast4: "9999" } });
  const base = { userId, productId, quantity: 1, cycleDays: 28, amount: 11400, status: "ACTIVE" as const, firstDeliveryDate: new Date(`${addDays(today, 3)}T00:00:00Z`), nextBillingDate: new Date(`${today}T00:00:00Z`) };
  const okSub = await prisma.subscription.create({ data: { ...base, paymentMethodId: ok.id } });
  const badSub = await prisma.subscription.create({ data: { ...base, paymentMethodId: bad.id } });
  failedSubId = badSub.id;
  await runBilling();
  paidOrderId = (await prisma.order.findFirstOrThrow({ where: { subscriptionId: okSub.id } })).id;
});
afterAll(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: [userEmail, adminEmail] } }, select: { id: true } });
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

describe("관리자 API", () => {
  it("ADMIN 이 아니면 403, 비로그인 401", async () => {
    expect((await user.get("/admin/dashboard")).status).toBe(403);
    expect((await user.post("/products").send({})).status).toBe(403);
    expect((await request(app).get("/admin/orders")).status).toBe(401);
  });

  it("대시보드: 활성·실패 구독, 오늘 결제 성공·실패, 월 매출, 최근 14일", async () => {
    const res = await admin.get("/admin/dashboard");
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.activeSubscriptions).toBeGreaterThanOrEqual(1);
    expect(d.failedSubscriptions).toBeGreaterThanOrEqual(1);
    expect(d.todayPaid).toBeGreaterThanOrEqual(1);
    expect(d.todayFailed).toBeGreaterThanOrEqual(1);
    expect(d.monthlyRevenue).toBeGreaterThanOrEqual(11400);
    expect(d.last14Days).toHaveLength(14);
    expect(d.last14Days[13].date).toBe(today);
    expect(d.last14Days[13].paid).toBeGreaterThanOrEqual(1);
  });

  it("상품 등록·수정·비활성(품절) → 공개 목록에서 사라짐, 관리자 목록에는 남음", async () => {
    const created = await admin.post("/products").send({ name: `${tag} 신상품`, description: "설명", category: "PET", price: 5000, stock: 3 });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: `${tag} 신상품`, subscriptionPrice: 4750, isActive: true });
    const id = created.body.data.id as string;
    expect((await admin.post("/products").send({ name: "", category: "PET", price: 10 })).status).toBe(400);
    const updated = await admin.patch(`/products/${id}`).send({ price: 6000, isActive: false });
    expect(updated.body.data).toMatchObject({ price: 6000, isActive: false });
    expect((await request(app).get(`/products/${id}`)).status).toBe(404);
    const list = await admin.get(`/admin/products?q=${encodeURIComponent(tag)}`);
    expect(list.body.data.items.some((p: { id: string }) => p.id === id)).toBe(true);
    expect((await admin.patch("/products/nope").send({ price: 1000 })).status).toBe(404);
  });

  it("주문 목록 필터, 배송 상태 변경 → 배송 출발 알림 1회", async () => {
    const list = await admin.get(`/admin/orders?status=PAID&q=${encodeURIComponent(tag)}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.some((o: { id: string }) => o.id === paidOrderId)).toBe(true);
    expect(list.body.data.items[0].user.email).toBeDefined();
    const shipped = await admin.patch(`/admin/orders/${paidOrderId}/delivery`).send({ deliveryStatus: "SHIPPED" });
    expect(shipped.status).toBe(200);
    expect(shipped.body.data.deliveryStatus).toBe("SHIPPED");
    await admin.patch(`/admin/orders/${paidOrderId}/delivery`).send({ deliveryStatus: "SHIPPED" });
    expect(await prisma.notification.count({ where: { userId, type: "SHIPPED" } })).toBe(1);
    expect((await admin.patch(`/admin/orders/${paidOrderId}/delivery`).send({ deliveryStatus: "LOST" })).status).toBe(400);
    const failedOrder = await prisma.order.findFirstOrThrow({ where: { subscriptionId: failedSubId } });
    expect((await admin.patch(`/admin/orders/${failedOrder.id}/delivery`).send({ deliveryStatus: "SHIPPED" })).status).toBe(409);
    // 회원 쪽 주문 상세에도 반영
    expect((await user.get(`/orders/${paidOrderId}`)).body.data.deliveryStatus).toBe("SHIPPED");
  });

  it("구독 목록(상태 필터·사용자 정보), 결제 실패 목록(재시도 예정·사유)", async () => {
    const subs = await admin.get(`/admin/subscriptions?status=PAYMENT_FAILED&q=${encodeURIComponent(tag)}`);
    expect(subs.status).toBe(200);
    expect(subs.body.data.items.some((s: { id: string }) => s.id === failedSubId)).toBe(true);
    expect(subs.body.data.items[0].user.email).toBe(userEmail);
    const failed = await admin.get("/admin/payments/failed");
    const mine = failed.body.data.find((f: { subscriptionId: string }) => f.subscriptionId === failedSubId);
    expect(mine).toMatchObject({ failCount: 1, user: { email: userEmail } });
    expect(mine.nextRetryAt).toBeTruthy();
    expect(mine.lastFailReason).toContain("거절");
  });
});
