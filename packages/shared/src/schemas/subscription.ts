import { z } from "zod";
import { CYCLE_MAX_DAYS, CYCLE_MIN_DAYS } from "../constants";

const cycleDays = z.number().int().min(CYCLE_MIN_DAYS).max(CYCLE_MAX_DAYS);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

export const createSubscriptionSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  cycleDays,
  firstDeliveryDate: isoDate,
  paymentMethodId: z.string().min(1).optional(),
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z
  .object({ quantity: z.number().int().min(1).max(20).optional(), cycleDays: cycleDays.optional() })
  .refine((v) => v.quantity !== undefined || v.cycleDays !== undefined, { message: "변경할 값이 없습니다." });
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const resumeSubscriptionSchema = z.object({ nextBillingDate: isoDate.optional() });
export type ResumeSubscriptionInput = z.infer<typeof resumeSubscriptionSchema>;

export const activateSubscriptionSchema = z.object({ paymentMethodId: z.string().min(1) });
export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>;
