import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, orderKeyFor, todayKst } from "@routinebox/shared";
import { createApp } from "../src/app.ts";
import { encryptSecret } from "../src/lib/crypto.ts";
import { prisma } from "../src/lib/prisma.ts";
import { runBilling, runBillingReminders } from "../src/modules/billing/service.ts";

const app = createApp();
const tag = `bill${Date.now()}`;
const email = `${tag}@test.local`;
const adminEmail = `${tag}-admin@test.local`;
const agent = request.agent(app);
const admin = request.agent(app);
const today = todayKst();
let userId = "";
let productId = "";
let okPm = "";
let failPm = "";

/** 결제 예정일이 `billingDate` 인 ACTIVE 구독을 직접 만든다 (첫 배송일 검증을 우회). */
async function activeSub(paymentMethodId: string, billingDate: string, cycleDays = 28) {
  return prisma.subscription.create({
    data: { userId, productId, paymentMethodId, quantity: 2, cycleDays, amount: 19000, status: "ACTIVE", firstDeliveryDate: new Date(`${addDays(billingDate, 3)}T00:00:00Z`), nextBillingDate: new Date(`${billingDate}T00:00:00Z`) },
  });
}

beforeAll(async () => {
  await agent.post("/auth/register").send({ email, password: "password123", name: "결제자" });
  await admin.post("/auth/register").send({ email: adminEmail, password: "password123", name: "관리자" });
  await prisma.user.update({ where: { email: adminEmail }, data: { role: "ADMIN" } });
  await admin.post("/auth/login").send({ email: adminEmail, password: "password123" }); // ADMIN 역할이 담긴 토큰 재발급
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  userId = user.id;
  const p = await prisma.product.create({ data: { name: `${tag} 원두`, category: "COFFEE", price: 10000, recommendedCycleDays: 28, stock: 50 } });
  productId = p.id;
  okPm = (await prisma.paymentMethod.create({ data: { userId, customerKey: `cust_${userId}`, billingKeyEnc: encryptSecret("mock_ok"), cardCompany: "테스트카드", cardLast4: "0000" } })).id;
  failPm = (await prisma.paymentMethod.create({ data: { userId, customerKey: `cust_${userId}`, billingKeyEnc: encryptSecret("mock_fail"), cardCompany: "테스트카드", cardLast4: "9999" } })).id;
});
afterAll(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: [email, adminEmail] } }, select: { id: true } });
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

describe("자동 결제 배치", () => {
  it("결제 예정 구독 → 주문(PAID)·결제 기록, 다음 결제일 += 주기, 결제 완료 알림", async () => {
    const sub = await activeSub(okPm, today);
    const r = await runBilling();
    const mine = r.items.find((i) => i.subscriptionId === sub.id);
    expect(mine).toMatchObject({ result: "PAID", orderKey: orderKeyFor(sub.id, today) });
    const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id }, include: { orders: { include: { payment: true } } } });
    expect(after.status).toBe("ACTIVE");
    expect(after.failCount).toBe(0);
    expect(after.nextBillingDate?.toISOString().slice(0, 10)).toBe(addDays(today, 28));
    expect(after.orders).toHaveLength(1);
    expect(after.orders[0]).toMatchObject({ status: "PAID", amount: 19000, quantity: 2, deliveryStatus: "PREPARING" });
    expect(after.orders[0].deliveryDate.toISOString().slice(0, 10)).toBe(addDays(today, 3));
    expect(after.orders[0].payment).toMatchObject({ status: "APPROVED", amount: 19000 });
    expect(await prisma.notification.count({ where: { subscriptionId: sub.id, type: "PAYMENT_SUCCESS" } })).toBe(1);
  });

  it("같은 회차는 두 번 결제하지 않는다 (orderKey 멱등)", async () => {
    const sub = await activeSub(okPm, today);
    await runBilling();
    await prisma.subscription.update({ where: { id: sub.id }, data: { nextBillingDate: new Date(`${today}T00:00:00Z`) } }); // 예정일이 되돌아간 상황
    const r = await runBilling();
    expect(r.items.find((i) => i.subscriptionId === sub.id)?.result).toBe("SKIPPED");
    expect(await prisma.order.count({ where: { subscriptionId: sub.id } })).toBe(1);
  });

  it("밀린 배치: 예정일이 과거면 오늘 이후 결제일이 될 때까지 주기를 더한다", async () => {
    const sub = await activeSub(okPm, addDays(today, -30), 14);
    const r = await runBilling();
    expect(r.items.find((i) => i.subscriptionId === sub.id)?.result).toBe("PAID");
    const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } });
    expect(after.nextBillingDate!.toISOString().slice(0, 10) > today).toBe(true);
    expect(await prisma.order.count({ where: { subscriptionId: sub.id } })).toBe(1);
  });

  it("승인 실패 → PAYMENT_FAILED(1/3), 내일 09:00 재시도, 주문 FAILED + 실패 사유, 실패 알림", async () => {
    const sub = await activeSub(failPm, today);
    const r = await runBilling();
    expect(r.items.find((i) => i.subscriptionId === sub.id)).toMatchObject({ result: "FAILED" });
    const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id }, include: { orders: { include: { payment: true } } } });
    expect(after).toMatchObject({ status: "PAYMENT_FAILED", failCount: 1 });
    expect(after.nextRetryAt?.toISOString()).toBe(new Date(`${addDays(today, 1)}T09:00:00+09:00`).toISOString());
    expect(after.nextBillingDate?.toISOString().slice(0, 10)).toBe(today); // 회차는 그대로
    expect(after.orders[0]).toMatchObject({ status: "FAILED" });
    expect(after.orders[0].payment?.failReason).toContain("승인 거절");
    expect(await prisma.notification.count({ where: { subscriptionId: sub.id, type: "PAYMENT_FAILED" } })).toBe(1);
  });

  it("재시도 성공: 카드 변경 후 다음 날 배치 → 같은 회차 주문이 PAID 로 바뀌고 ACTIVE 복귀", async () => {
    const sub = await activeSub(failPm, today);
    await runBilling();
    await prisma.subscription.update({ where: { id: sub.id }, data: { paymentMethodId: okPm } });
    const tomorrow = addDays(today, 1);
    const r = await runBilling({ asOf: tomorrow });
    expect(r.items.find((i) => i.subscriptionId === sub.id)?.result).toBe("PAID");
    const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id }, include: { orders: { include: { payment: true } } } });
    expect(after).toMatchObject({ status: "ACTIVE", failCount: 0, nextRetryAt: null });
    expect(after.nextBillingDate?.toISOString().slice(0, 10)).toBe(addDays(today, 28));
    expect(after.orders).toHaveLength(1);
    expect(after.orders[0]).toMatchObject({ status: "PAID", orderKey: orderKeyFor(sub.id, today) });
    expect(after.orders[0].billingDate.toISOString().slice(0, 10)).toBe(tomorrow);
    expect(after.orders[0].payment).toMatchObject({ status: "APPROVED", failReason: null });
  });

  it("3회 연속 실패 → 자동 해지(CANCELLED, PAYMENT_FAILED 사유) + 해지 알림", async () => {
    const sub = await activeSub(failPm, today);
    await runBilling();
    await runBilling({ asOf: addDays(today, 1) });
    expect((await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } })).failCount).toBe(2);
    const r = await runBilling({ asOf: addDays(today, 2) });
    expect(r.items.find((i) => i.subscriptionId === sub.id)?.result).toBe("CANCELLED");
    const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } });
    expect(after).toMatchObject({ status: "CANCELLED", failCount: 3, cancelledReason: "PAYMENT_FAILED", nextRetryAt: null });
    expect(after.cancelledAt).not.toBeNull();
    expect(await prisma.notification.count({ where: { subscriptionId: sub.id, type: "CANCELLED" } })).toBe(1);
    // 해지된 구독은 더 이상 처리 대상이 아니다
    const again = await runBilling({ asOf: addDays(today, 3) });
    expect(again.items.find((i) => i.subscriptionId === sub.id)).toBeUndefined();
  });

  it("PAUSED·PENDING·미래 예정 구독은 처리하지 않는다", async () => {
    const future = await activeSub(okPm, addDays(today, 5));
    const paused = await activeSub(okPm, today);
    await prisma.subscription.update({ where: { id: paused.id }, data: { status: "PAUSED" } });
    const r = await runBilling();
    expect(r.items.map((i) => i.subscriptionId)).not.toContain(future.id);
    expect(r.items.map((i) => i.subscriptionId)).not.toContain(paused.id);
  });

  it("D-1 알림: 내일 결제 예정 구독에 한 번만 기록한다", async () => {
    const sub = await activeSub(okPm, addDays(today, 1));
    const first = await runBillingReminders();
    expect(first.sent).toBeGreaterThanOrEqual(1);
    const second = await runBillingReminders();
    expect(second.skipped).toBeGreaterThanOrEqual(1);
    expect(await prisma.notification.count({ where: { subscriptionId: sub.id, type: "BILLING_D1" } })).toBe(1);
  });

  it("수동 실행 API: 일반 사용자 403, 관리자 200 (asOf 지정)", async () => {
    expect((await agent.post("/internal/billing/run").send({})).status).toBe(403);
    const sub = await activeSub(okPm, addDays(today, 10));
    const res = await admin.post("/internal/billing/run").send({ asOf: addDays(today, 10) });
    expect(res.status).toBe(200);
    expect(res.body.data.asOf).toBe(addDays(today, 10));
    expect(res.body.data.items.find((i: { subscriptionId: string }) => i.subscriptionId === sub.id)?.result).toBe("PAID");
    expect((await admin.post("/internal/billing/run").send({ asOf: "2026/01/01" })).status).toBe(400);
    expect((await admin.post("/internal/billing/remind").send({})).status).toBe(200);
  });
});
