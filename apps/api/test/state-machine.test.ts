import { describe, expect, it } from "vitest";
import { transition, type SubState } from "../src/modules/subscription/state-machine.ts";

const base: SubState = { status: "ACTIVE", cycleDays: 28, quantity: 1, amount: 12250, nextBillingDate: "2026-09-05", failCount: 0, paymentMethodId: "pm1" };
const at = (status: SubState["status"], extra: Partial<SubState> = {}): SubState => ({ ...base, status, ...extra });

describe("구독 상태 머신", () => {
  it("PENDING → ACTIVATE → ACTIVE", () => {
    const p = transition(at("PENDING", { paymentMethodId: null }), { type: "ACTIVATE", paymentMethodId: "pm1", nextBillingDate: "2026-09-10" });
    expect(p).toMatchObject({ status: "ACTIVE", paymentMethodId: "pm1", nextBillingDate: "2026-09-10", failCount: 0 });
  });
  it("ACTIVE + SKIP → 다음 결제일 += 주기", () => {
    expect(transition(base, { type: "SKIP" })).toMatchObject({ status: "ACTIVE", nextBillingDate: "2026-10-03" });
  });
  it("ACTIVE + UPDATE → 수량·주기·금액 변경, 결제일 유지", () => {
    const p = transition(base, { type: "UPDATE", quantity: 2, cycleDays: 14, amount: 24500 });
    expect(p).toMatchObject({ status: "ACTIVE", quantity: 2, cycleDays: 14, amount: 24500 });
    expect(p.nextBillingDate).toBeUndefined();
  });
  it("ACTIVE ↔ PAUSED", () => {
    expect(transition(base, { type: "PAUSE" }).status).toBe("PAUSED");
    expect(transition(at("PAUSED"), { type: "RESUME", nextBillingDate: "2026-09-20" })).toMatchObject({ status: "ACTIVE", nextBillingDate: "2026-09-20", pausedAt: null });
  });
  it("ACTIVE + PAYMENT_SUCCEEDED → 다음 결제일 갱신, 실패 카운트 초기화", () => {
    expect(transition(base, { type: "PAYMENT_SUCCEEDED", nextBillingDate: "2026-10-03" })).toMatchObject({ status: "ACTIVE", nextBillingDate: "2026-10-03", failCount: 0, nextRetryAt: null });
    expect(() => transition(at("PAYMENT_FAILED"), { type: "PAYMENT_SUCCEEDED", nextBillingDate: "2026-10-03" })).toThrow();
  });
  it("결제 실패 → 재시도 성공 / 3회 실패 → 자동 해지", () => {
    const failed = transition(base, { type: "PAYMENT_FAILED", nextRetryAt: new Date() });
    expect(failed).toMatchObject({ status: "PAYMENT_FAILED", failCount: 1 });
    expect(transition(at("PAYMENT_FAILED", { failCount: 1 }), { type: "PAYMENT_RETRY_SUCCEEDED", nextBillingDate: "2026-10-03" })).toMatchObject({ status: "ACTIVE", failCount: 0 });
    expect(() => transition(at("PAYMENT_FAILED", { failCount: 2 }), { type: "AUTO_CANCEL" })).toThrow();
    expect(transition(at("PAYMENT_FAILED", { failCount: 3 }), { type: "AUTO_CANCEL" })).toMatchObject({ status: "CANCELLED", cancelledReason: "PAYMENT_FAILED" });
  });
  it("해지는 CANCELLED 를 제외한 모든 상태에서 가능하고 되돌릴 수 없다", () => {
    for (const s of ["PENDING", "ACTIVE", "PAUSED", "PAYMENT_FAILED"] as const) {
      expect(transition(at(s), { type: "CANCEL" }).status).toBe("CANCELLED");
    }
    expect(() => transition(at("CANCELLED"), { type: "CANCEL" })).toThrow();
    expect(() => transition(at("CANCELLED"), { type: "RESUME", nextBillingDate: "2026-09-20" })).toThrow();
  });
  it("금지 전이: PAUSED+SKIP, PENDING+PAUSE, ACTIVE+RESUME, PAYMENT_FAILED+UPDATE", () => {
    expect(() => transition(at("PAUSED"), { type: "SKIP" })).toThrowError(/일시정지|PAUSED/);
    expect(() => transition(at("PENDING"), { type: "PAUSE" })).toThrow();
    expect(() => transition(base, { type: "RESUME", nextBillingDate: "2026-09-20" })).toThrow();
    expect(() => transition(at("PAYMENT_FAILED"), { type: "UPDATE", quantity: 1, cycleDays: 28, amount: 1 })).toThrow();
  });
});
