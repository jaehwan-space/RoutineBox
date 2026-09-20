import { z } from "zod";

/** 토스 카드 등록창 successUrl 로 돌아온 값 */
export const billingAuthSchema = z.object({
  authKey: z.string().min(1),
  customerKey: z.string().min(1),
});
export type BillingAuthInput = z.infer<typeof billingAuthSchema>;
