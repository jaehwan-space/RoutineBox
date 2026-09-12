"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionDto, SubscriptionListDto } from "@routinebox/shared";
import { useToast, type BadgeStatus } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useMe } from "@/features/auth/useMe";
import { subscriptionApi } from "./api";

export const SUBS_KEY = ["subscriptions"] as const;

export const STATUS_BADGE: Record<SubscriptionDto["status"], BadgeStatus> = {
  ACTIVE: "active", PAUSED: "paused", PAYMENT_FAILED: "failed", PENDING: "pending", CANCELLED: "cancelled",
};

export function useSubscriptions() {
  const { data: me } = useMe();
  return useQuery<SubscriptionListDto>({ queryKey: SUBS_KEY, queryFn: subscriptionApi.list, enabled: !!me });
}

export function useSubscription(id: string) {
  return useQuery<SubscriptionDto>({ queryKey: [...SUBS_KEY, id], queryFn: () => subscriptionApi.get(id) });
}

/** 상태 전이 뮤테이션. 응답으로 받은 구독을 목록 캐시에 바로 반영한다. */
export function useSubscriptionActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const replace = (updated: SubscriptionDto) => {
    qc.setQueryData<SubscriptionListDto>(SUBS_KEY, (prev) => prev ? { ...prev, items: prev.items.map((s) => (s.id === updated.id ? updated : s)) } : prev);
    qc.setQueryData([...SUBS_KEY, updated.id], updated);
    void qc.invalidateQueries({ queryKey: SUBS_KEY });
  };
  const fail = (err: unknown, fallback: string) => toast.error(err instanceof ApiError ? err.message : fallback);
  const make = <TArgs,>(fn: (args: TArgs) => Promise<SubscriptionDto>, success: (s: SubscriptionDto) => string, fallback: string) =>
    useMutation({ mutationFn: fn, onSuccess: (s) => { replace(s); toast.success(success(s)); }, onError: (e) => fail(e, fallback) });

  return {
    skip: make((id: string) => subscriptionApi.skip(id), (s) => `이번 회차를 건너뛰었어요. 다음 결제일은 ${s.nextBillingDate} 입니다.`, "건너뛰기를 적용하지 못했어요."),
    pause: make((id: string) => subscriptionApi.pause(id), () => "구독을 일시정지했어요. 재개할 때까지 결제되지 않아요.", "일시정지하지 못했어요."),
    resume: make((id: string) => subscriptionApi.resume(id), (s) => `구독을 재개했어요. 다음 결제일은 ${s.nextBillingDate} 입니다.`, "재개하지 못했어요."),
    cancel: make((id: string) => subscriptionApi.cancel(id), () => "구독을 해지했어요.", "해지하지 못했어요."),
    activate: make((v: { id: string; paymentMethodId: string }) => subscriptionApi.activate(v.id, { paymentMethodId: v.paymentMethodId }), (s) => `구독을 시작했어요. 첫 결제일은 ${s.nextBillingDate} 입니다.`, "구독을 시작하지 못했어요."),
    update: make((v: { id: string; quantity?: number; cycleDays?: number }) => subscriptionApi.update(v.id, { quantity: v.quantity, cycleDays: v.cycleDays }), () => "주기·수량을 변경했어요.", "변경하지 못했어요."),
  };
}
