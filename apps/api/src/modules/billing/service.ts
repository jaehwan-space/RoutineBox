import type { Prisma } from "@prisma/client";
import {
  addDays, deliveryDateFor, fromDbDate, kstDateTime, orderKeyFor, toDbDate, todayKst,
  MAX_PAYMENT_RETRY, type BillingRunResult, type YMD,
} from "@routinebox/shared";
import { decryptSecret } from "../../lib/crypto.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { approveBilling } from "../../lib/toss.js";
import * as notifications from "../notification/service.js";
import { transition, type SubPatch, type SubState } from "../subscription/state-machine.js";

/** 재시도 시각: 다음 날 09:00 KST (배치 시각과 동일) */
export const RETRY_HOUR_KST = 9;

const dueInclude = {
  user: { select: { id: true, email: true, name: true } },
  product: { select: { id: true, name: true } },
  paymentMethod: { select: { id: true, customerKey: true, billingKeyEnc: true, cardCompany: true, cardLast4: true, deletedAt: true } },
} satisfies Prisma.SubscriptionInclude;
type DueSub = Prisma.SubscriptionGetPayload<{ include: typeof dueInclude }>;

type ChargeOutcome =
  | { ok: true; paymentKey: string | null; approvedAt: Date; raw: unknown }
  | { ok: false; reason: string; code?: string; raw?: unknown };

/** 빌링키로 승인 요청. 모의 카드(mock_…)는 토스를 부르지 않고, mock_fail… 은 항상 실패한다(테스트·시연용). */
async function charge(sub: DueSub, orderId: string, now: Date): Promise<ChargeOutcome> {
  const pm = sub.paymentMethod;
  if (!pm || pm.deletedAt) return { ok: false, reason: "등록된 결제 수단이 없습니다.", code: "NO_PAYMENT_METHOD" };
  const billingKey = decryptSecret(pm.billingKeyEnc);
  if (billingKey.startsWith("mock_")) {
    if (billingKey.startsWith("mock_fail")) return { ok: false, reason: "카드사 승인 거절 (모의 실패)", code: "MOCK_DECLINED" };
    return { ok: true, paymentKey: `mock_${orderId}`, approvedAt: now, raw: { mock: true } };
  }
  try {
    const r = await approveBilling({
      billingKey, customerKey: pm.customerKey, orderId, orderName: `${sub.product.name} ${sub.quantity}개 (정기배송)`,
      amount: sub.amount, customerEmail: sub.user.email, customerName: sub.user.name,
    });
    return { ok: true, paymentKey: r.paymentKey, approvedAt: r.approvedAt, raw: r.raw };
  } catch (err) {
    if (err instanceof AppError && err.code === "PAYMENT_FAILED") {
      const d = (err.details ?? {}) as { code?: string; raw?: unknown };
      return { ok: false, reason: err.message, code: d.code, raw: d.raw };
    }
    throw err; // 네트워크 오류 등은 실패로 세지 않고 다음 배치에서 다시 시도한다.
  }
}

const toState = (s: DueSub): SubState => ({
  status: s.status, cycleDays: s.cycleDays, quantity: s.quantity, amount: s.amount,
  nextBillingDate: s.nextBillingDate ? fromDbDate(s.nextBillingDate) : null, failCount: s.failCount, paymentMethodId: s.paymentMethodId,
});

function patchToData(patch: SubPatch): Prisma.SubscriptionUpdateInput {
  const { nextBillingDate, paymentMethodId: _pm, ...rest } = patch;
  return { ...rest, ...(nextBillingDate !== undefined ? { nextBillingDate: nextBillingDate ? toDbDate(nextBillingDate) : null } : {}) };
}

/** 다음 결제일: 예정일 + 주기. 배치가 밀려 결과가 오늘 이전이면 오늘 이후가 될 때까지 주기를 더한다(중복 청구 방지). */
function nextBillingAfter(scheduled: YMD, cycleDays: number, today: YMD): YMD {
  let next = addDays(scheduled, cycleDays);
  while (next <= today) next = addDays(next, cycleDays);
  return next;
}

type ItemResult = BillingRunResult["items"][number];

async function processOne(sub: DueSub, today: YMD, now: Date): Promise<ItemResult> {
  if (!sub.nextBillingDate) return { subscriptionId: sub.id, orderKey: "", result: "ERROR", message: "결제 예정일이 없습니다." };
  const scheduled = fromDbDate(sub.nextBillingDate);
  const orderKey = orderKeyFor(sub.id, scheduled);
  const existing = await prisma.order.findUnique({ where: { orderKey }, include: { payment: true } });
  if (existing?.status === "PAID") return { subscriptionId: sub.id, orderKey, result: "SKIPPED", message: "이미 결제된 회차" };

  const attempt = sub.failCount + 1;
  const tossOrderId = attempt === 1 ? orderKey : `${orderKey}_r${attempt}`;
  const outcome = await charge(sub, tossOrderId, now);
  const billingDate = toDbDate(today);
  const deliveryDate = toDbDate(deliveryDateFor(today));
  const orderBase = { amount: sub.amount, quantity: sub.quantity, billingDate, deliveryDate };
  const mailCtx = { user: sub.user, productName: sub.product.name, amount: sub.amount, quantity: sub.quantity, billingDate: today, deliveryDate: deliveryDateFor(today) };

  if (outcome.ok) {
    const next = nextBillingAfter(scheduled, sub.cycleDays, today);
    const patch = transition(toState(sub), sub.status === "PAYMENT_FAILED"
      ? { type: "PAYMENT_RETRY_SUCCEEDED", nextBillingDate: next }
      : { type: "PAYMENT_SUCCEEDED", nextBillingDate: next }, now);
    const payment = { status: "APPROVED" as const, amount: sub.amount, paymentKey: outcome.paymentKey, approvedAt: outcome.approvedAt, failReason: null, rawResponse: outcome.raw as Prisma.InputJsonValue };
    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.order.update({ where: { id: existing.id }, data: { ...orderBase, status: "PAID", payment: { upsert: { create: payment, update: payment } } } });
      } else {
        await tx.order.create({ data: { ...orderBase, orderKey, subscriptionId: sub.id, userId: sub.userId, status: "PAID", payment: { create: payment } } });
      }
      await tx.subscription.update({ where: { id: sub.id }, data: patchToData(patch) });
      await notifications.record({ userId: sub.userId, subscriptionId: sub.id, type: "PAYMENT_SUCCESS", periodKey: orderKey }, tx);
    });
    await notifications.notifyByMail("PAYMENT_SUCCESS", mailCtx);
    return { subscriptionId: sub.id, orderKey, result: "PAID" };
  }

  // 승인 실패: PAYMENT_FAILED 전이, 3회 연속이면 자동 해지
  const nextRetryAt = kstDateTime(addDays(today, 1), RETRY_HOUR_KST);
  let patch = transition(toState(sub), { type: "PAYMENT_FAILED", nextRetryAt }, now);
  const failCount = patch.failCount ?? sub.failCount + 1;
  const autoCancel = failCount >= MAX_PAYMENT_RETRY;
  if (autoCancel) {
    patch = { ...patch, ...transition({ ...toState(sub), status: "PAYMENT_FAILED", failCount }, { type: "AUTO_CANCEL" }, now) };
  }
  const payment = { status: "FAILED" as const, amount: sub.amount, paymentKey: null, approvedAt: null, failReason: outcome.reason, rawResponse: (outcome.raw ?? { code: outcome.code }) as Prisma.InputJsonValue };
  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.order.update({ where: { id: existing.id }, data: { ...orderBase, status: "FAILED", payment: { upsert: { create: payment, update: payment } } } });
    } else {
      await tx.order.create({ data: { ...orderBase, orderKey, subscriptionId: sub.id, userId: sub.userId, status: "FAILED", payment: { create: payment } } });
    }
    await tx.subscription.update({ where: { id: sub.id }, data: patchToData(patch) });
    await notifications.record({ userId: sub.userId, subscriptionId: sub.id, type: "PAYMENT_FAILED", periodKey: `${orderKey}:${failCount}` }, tx);
    if (autoCancel) await notifications.record({ userId: sub.userId, subscriptionId: sub.id, type: "CANCELLED", periodKey: `AUTO:${orderKey}` }, tx);
  });
  await notifications.notifyByMail("PAYMENT_FAILED", { ...mailCtx, failReason: outcome.reason, failCount });
  if (autoCancel) await notifications.notifyByMail("CANCELLED", mailCtx);
  return { subscriptionId: sub.id, orderKey, result: autoCancel ? "CANCELLED" : "FAILED", message: outcome.reason };
}

let running: Promise<BillingRunResult> | null = null;

/**
 * 자동 결제 배치. `status = ACTIVE AND nextBillingDate <= today` 와 `status = PAYMENT_FAILED AND nextRetryAt <= today 23:59` 를 처리한다.
 * 구독 단위로 독립 실행하며 한 건의 예외가 다른 건을 막지 않는다. 동시에 두 번 돌지 않는다(프로세스 내 잠금).
 */
export function runBilling(opts: { asOf?: YMD; now?: Date } = {}): Promise<BillingRunResult> {
  if (running) throw new AppError("CONFLICT", "결제 배치가 이미 실행 중입니다.");
  running = (async () => {
    const now = opts.now ?? new Date();
    const today = opts.asOf ?? todayKst(now);
    const due = await prisma.subscription.findMany({
      where: { OR: [
        { status: "ACTIVE", nextBillingDate: { lte: toDbDate(today) } },
        { status: "PAYMENT_FAILED", nextRetryAt: { lte: kstDateTime(today, 23, 59) } },
      ] },
      include: dueInclude,
      orderBy: [{ nextBillingDate: "asc" }, { createdAt: "asc" }],
    });
    const result: BillingRunResult = { asOf: today, processed: due.length, paid: 0, failed: 0, skipped: 0, cancelled: 0, items: [] };
    for (const sub of due) {
      try {
        const item = await processOne(sub, today, now);
        result.items.push(item);
        if (item.result === "PAID") result.paid += 1;
        else if (item.result === "FAILED") result.failed += 1;
        else if (item.result === "CANCELLED") { result.failed += 1; result.cancelled += 1; }
        else if (item.result === "SKIPPED") result.skipped += 1;
      } catch (err) {
        console.error(`[billing] 구독 ${sub.id} 처리 오류:`, err);
        result.items.push({ subscriptionId: sub.id, orderKey: sub.nextBillingDate ? orderKeyFor(sub.id, fromDbDate(sub.nextBillingDate)) : "", result: "ERROR", message: err instanceof Error ? err.message : String(err) });
      }
    }
    return result;
  })().finally(() => { running = null; });
  return running;
}

/** D-1 알림: 내일 결제 예정인 ACTIVE 구독에 메일을 보내고 Notification(BILLING_D1, 회차)을 남긴다. 같은 회차는 한 번만. */
export async function runBillingReminders(opts: { asOf?: YMD; now?: Date } = {}): Promise<{ asOf: string; sent: number; skipped: number }> {
  const today = opts.asOf ?? todayKst(opts.now ?? new Date());
  const tomorrow = addDays(today, 1);
  const subs = await prisma.subscription.findMany({ where: { status: "ACTIVE", nextBillingDate: toDbDate(tomorrow) }, include: dueInclude });
  let sent = 0, skipped = 0;
  for (const sub of subs) {
    const periodKey = orderKeyFor(sub.id, tomorrow);
    const fresh = await notifications.record({ userId: sub.userId, subscriptionId: sub.id, type: "BILLING_D1", periodKey });
    if (!fresh) { skipped += 1; continue; }
    await notifications.notifyByMail("BILLING_D1", { user: sub.user, productName: sub.product.name, amount: sub.amount, quantity: sub.quantity, billingDate: tomorrow, deliveryDate: deliveryDateFor(tomorrow) });
    sent += 1;
  }
  return { asOf: today, sent, skipped };
}
