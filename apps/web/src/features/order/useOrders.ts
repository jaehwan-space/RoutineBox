"use client";

import { useQuery } from "@tanstack/react-query";
import type { BadgeStatus } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";
import { orderApi } from "./api";

export const ORDERS_KEY = ["orders"] as const;

export const ORDER_BADGE: Record<"PENDING" | "PAID" | "FAILED" | "CANCELLED", BadgeStatus> = { PENDING: "pending", PAID: "active", FAILED: "failed", CANCELLED: "cancelled" };
export const DELIVERY_BADGE: Record<"PREPARING" | "SHIPPED" | "DELIVERED", BadgeStatus> = { PREPARING: "neutral", SHIPPED: "accent", DELIVERED: "active" };

export function useOrders(page = 1) {
  const { data: me } = useMe();
  return useQuery({ queryKey: [...ORDERS_KEY, page], queryFn: () => orderApi.list(page), enabled: !!me });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: [...ORDERS_KEY, "detail", id], queryFn: () => orderApi.get(id) });
}
