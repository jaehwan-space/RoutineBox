"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaymentMethodDto } from "@routinebox/shared";
import { useToast } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useMe } from "@/features/auth/useMe";
import { paymentApi } from "./api";

export const PM_KEY = ["payment-methods"] as const;

export function usePaymentMethods() {
  const { data: me } = useMe();
  return useQuery<PaymentMethodDto[]>({ queryKey: PM_KEY, queryFn: paymentApi.list, enabled: !!me });
}

export function usePaymentMethodActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const refresh = () => qc.invalidateQueries({ queryKey: PM_KEY });
  const onError = (err: unknown, fallback: string) => toast.error(err instanceof ApiError ? err.message : fallback);
  const mock = useMutation({ mutationFn: paymentApi.mock, onSuccess: () => { refresh(); toast.success("테스트 카드를 등록했어요."); }, onError: (e) => onError(e, "테스트 카드를 등록하지 못했어요.") });
  const billingAuth = useMutation({ mutationFn: paymentApi.billingAuth, onSuccess: () => { refresh(); toast.success("카드를 등록했어요."); }, onError: (e) => onError(e, "카드를 등록하지 못했어요.") });
  const remove = useMutation({ mutationFn: paymentApi.remove, onSuccess: () => { refresh(); toast.success("카드를 삭제했어요."); }, onError: (e) => onError(e, "카드를 삭제하지 못했어요.") });
  return { mock, billingAuth, remove };
}
