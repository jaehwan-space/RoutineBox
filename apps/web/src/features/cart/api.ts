import type { CartCheckoutInput, CartCheckoutResultDto, CartDto, CartItemInput } from "@routinebox/shared";
import { api } from "@/lib/api";

export const cartApi = {
  get: () => api<CartDto>("/cart"),
  put: (input: CartItemInput) => api<CartDto>("/cart/items", { method: "PUT", body: JSON.stringify(input) }),
  remove: (productId: string) => api<CartDto>(`/cart/items/${productId}`, { method: "DELETE" }),
  /** 담은 상품 전부를 구독으로 만들고 장바구니를 비운다. */
  checkout: (input: CartCheckoutInput) => api<CartCheckoutResultDto>("/cart/checkout", { method: "POST", body: JSON.stringify(input) }),
};
