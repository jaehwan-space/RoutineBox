import { addDays, MAX_PAYMENT_RETRY, type SubscriptionStatus, type YMD } from "@routinebox/shared";
import { AppError } from "../../lib/errors.js";

/** 상태 머신이 보는 구독의 현재 값 */
export interface SubState {
  status: SubscriptionStatus;
  cycleDays: number;
  quantity: number;
  amount: number;
  nextBillingDate: YMD | null;
  failCount: number;
  paymentMethodId: string | null;
}

export type SubEvent =
  | { type: "ACTIVATE"; paymentMethodId: string; nextBillingDate: YMD }
  | { type: "SKIP" }
  | { type: "UPDATE"; quantity: number; cycleDays: number; amount: number }
  | { type: "PAUSE" }
  | { type: "RESUME"; nextBillingDate: YMD }
  | { type: "CANCEL" }
  | { type: "PAYMENT_SUCCEEDED"; nextBillingDate: YMD }
  | { type: "PAYMENT_FAILED"; nextRetryAt: Date }
  | { type: "PAYMENT_RETRY_SUCCEEDED"; nextBillingDate: YMD }
  | { type: "AUTO_CANCEL" };

export interface SubPatch {
  status: SubscriptionStatus;
  cycleDays?: number;
  quantity?: number;
  amount?: number;
  nextBillingDate?: YMD | null;
  nextRetryAt?: Date | null;
  failCount?: number;
  paymentMethodId?: string;
  pausedAt?: Date | null;
  cancelledAt?: Date | null;
  cancelledReason?: string | null;
}

const invalid = (state: SubState, event: SubEvent) =>
  new AppError("INVALID_TRANSITION", `${state.status} 상태에서는 ${EVENT_LABEL[event.type]}할 수 없습니다.`);

const EVENT_LABEL: Record<SubEvent["type"], string> = {
  ACTIVATE: "구독을 시작", SKIP: "건너뛰기", UPDATE: "주기·수량 변경", PAUSE: "일시정지", RESUME: "재개",
  CANCEL: "해지", PAYMENT_SUCCEEDED: "결제 성공 처리", PAYMENT_FAILED: "결제 실패 처리", PAYMENT_RETRY_SUCCEEDED: "재시도 성공 처리", AUTO_CANCEL: "자동 해지",
};

/**
 * docs/state-machine.md 의 전이표를 그대로 구현한 순수 함수.
 * 허용되지 않는 전이는 INVALID_TRANSITION 을 던진다. 저장은 서비스가 트랜잭션으로 한다.
 */
export function transition(state: SubState, event: SubEvent, now: Date = new Date()): SubPatch {
  const { status } = state;
  switch (event.type) {
    case "ACTIVATE":
      if (status !== "PENDING") throw invalid(state, event);
      return { status: "ACTIVE", paymentMethodId: event.paymentMethodId, nextBillingDate: event.nextBillingDate, failCount: 0, nextRetryAt: null };
    case "SKIP":
      if (status !== "ACTIVE" || !state.nextBillingDate) throw invalid(state, event);
      return { status: "ACTIVE", nextBillingDate: addDays(state.nextBillingDate, state.cycleDays) };
    case "UPDATE":
      if (status !== "ACTIVE") throw invalid(state, event);
      return { status: "ACTIVE", quantity: event.quantity, cycleDays: event.cycleDays, amount: event.amount };
    case "PAUSE":
      if (status !== "ACTIVE") throw invalid(state, event);
      return { status: "PAUSED", pausedAt: now };
    case "RESUME":
      if (status !== "PAUSED") throw invalid(state, event);
      return { status: "ACTIVE", nextBillingDate: event.nextBillingDate, pausedAt: null };
    case "CANCEL":
      if (status === "CANCELLED") throw invalid(state, event);
      return { status: "CANCELLED", cancelledAt: now, cancelledReason: "USER", nextRetryAt: null };
    case "PAYMENT_SUCCEEDED":
      if (status !== "ACTIVE") throw invalid(state, event);
      return { status: "ACTIVE", failCount: 0, nextRetryAt: null, nextBillingDate: event.nextBillingDate };
    case "PAYMENT_FAILED":
      if (status !== "ACTIVE" && status !== "PAYMENT_FAILED") throw invalid(state, event);
      return { status: "PAYMENT_FAILED", failCount: state.failCount + 1, nextRetryAt: event.nextRetryAt };
    case "PAYMENT_RETRY_SUCCEEDED":
      if (status !== "PAYMENT_FAILED") throw invalid(state, event);
      return { status: "ACTIVE", failCount: 0, nextRetryAt: null, nextBillingDate: event.nextBillingDate };
    case "AUTO_CANCEL":
      if (status !== "PAYMENT_FAILED" || state.failCount < MAX_PAYMENT_RETRY) throw invalid(state, event);
      return { status: "CANCELLED", cancelledAt: now, cancelledReason: "PAYMENT_FAILED", nextRetryAt: null };
  }
}
