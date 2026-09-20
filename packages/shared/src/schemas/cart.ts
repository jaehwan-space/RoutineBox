import { z } from "zod";
import { CYCLE_MAX_DAYS, CYCLE_MIN_DAYS } from "../constants";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

/**
 * 장바구니 일괄 구독 시작.
 * 담긴 상품마다 구독을 하나씩 만들고 장바구니를 비운다. 수량은 장바구니 값을 쓰고,
 * 배송 주기는 `cycles` 에 있으면 그 값을, 없으면 상품의 추천 주기를 쓴다.
 */
export const cartCheckoutSchema = z.object({
  firstDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다."),
  paymentMethodId: z.string().min(1).optional(),
  cycles: z
    .array(z.object({ productId: z.string().min(1), cycleDays: z.number().int().min(CYCLE_MIN_DAYS).max(CYCLE_MAX_DAYS) }))
    .max(50)
    .default([]),
});
export type CartCheckoutInput = z.infer<typeof cartCheckoutSchema>;
