import { z } from "zod";
import { DELIVERY_STATUSES, ORDER_STATUSES, SUBSCRIPTION_STATUSES } from "../constants";

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

export const orderQuerySchema = z.object({ page, pageSize });
export type OrderQuery = z.infer<typeof orderQuerySchema>;

export const adminOrderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  deliveryStatus: z.enum(DELIVERY_STATUSES).optional(),
  q: z.string().trim().max(50).optional(),
  page, pageSize,
});
export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;

export const adminSubscriptionQuerySchema = z.object({
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  q: z.string().trim().max(50).optional(),
  page, pageSize,
});
export type AdminSubscriptionQuery = z.infer<typeof adminSubscriptionQuerySchema>;

export const updateDeliveryStatusSchema = z.object({ deliveryStatus: z.enum(DELIVERY_STATUSES) });
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;

/** 결제 배치 수동 실행. asOf 를 주면 그 날짜를 "오늘"로 보고 결제 예정 구독을 처리한다 (점검·시연용). */
export const billingRunSchema = z.object({ asOf: isoDate.optional() });
export type BillingRunInput = z.infer<typeof billingRunSchema>;
