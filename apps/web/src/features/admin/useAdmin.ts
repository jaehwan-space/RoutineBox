"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminOrderQuery, AdminSubscriptionQuery, CreateProductInput, DeliveryStatus, UpdateProductInput } from "@routinebox/shared";
import { useToast } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { adminApi } from "./api";

export const ADMIN_KEY = ["admin"] as const;

export const useDashboard = () => useQuery({ queryKey: [...ADMIN_KEY, "dashboard"], queryFn: adminApi.dashboard });
export const useAdminProducts = (q?: string) => useQuery({ queryKey: [...ADMIN_KEY, "products", q ?? ""], queryFn: () => adminApi.products(q) });
export const useAdminOrders = (query: Partial<AdminOrderQuery>) => useQuery({ queryKey: [...ADMIN_KEY, "orders", query], queryFn: () => adminApi.orders(query) });
export const useAdminSubscriptions = (query: Partial<AdminSubscriptionQuery>) => useQuery({ queryKey: [...ADMIN_KEY, "subscriptions", query], queryFn: () => adminApi.subscriptions(query) });
export const useFailedPayments = () => useQuery({ queryKey: [...ADMIN_KEY, "failed"], queryFn: adminApi.failedPayments });

export function useAdminActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const refresh = () => qc.invalidateQueries({ queryKey: ADMIN_KEY });
  const fail = (err: unknown, fallback: string) => toast.error(err instanceof ApiError ? err.message : fallback);
  return {
    createProduct: useMutation({ mutationFn: (input: CreateProductInput) => adminApi.createProduct(input), onSuccess: () => { refresh(); toast.success("상품을 등록했어요."); }, onError: (e) => fail(e, "상품을 등록하지 못했어요.") }),
    updateProduct: useMutation({ mutationFn: (v: { id: string; input: UpdateProductInput }) => adminApi.updateProduct(v.id, v.input), onSuccess: () => { refresh(); toast.success("상품을 수정했어요."); }, onError: (e) => fail(e, "상품을 수정하지 못했어요.") }),
    updateDelivery: useMutation({ mutationFn: (v: { id: string; deliveryStatus: DeliveryStatus }) => adminApi.updateDelivery(v.id, v.deliveryStatus), onSuccess: () => { refresh(); toast.success("배송 상태를 바꿨어요."); }, onError: (e) => fail(e, "배송 상태를 바꾸지 못했어요.") }),
    runBilling: useMutation({ mutationFn: (asOf?: string) => adminApi.runBilling(asOf), onSuccess: (r) => { refresh(); void qc.invalidateQueries({ queryKey: ["subscriptions"] }); void qc.invalidateQueries({ queryKey: ["orders"] }); toast.success(`결제 배치 완료 (${r.asOf}) · 처리 ${r.processed} · 성공 ${r.paid} · 실패 ${r.failed} · 건너뜀 ${r.skipped}`); }, onError: (e) => fail(e, "결제 배치를 실행하지 못했어요.") }),
    runReminders: useMutation({ mutationFn: (asOf?: string) => adminApi.runReminders(asOf), onSuccess: (r) => { refresh(); toast.success(`D-1 알림 발송 ${r.sent} · 이미 보냄 ${r.skipped}`); }, onError: (e) => fail(e, "알림 배치를 실행하지 못했어요.") }),
  };
}
