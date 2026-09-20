import type { CartDto, CartItemInput } from "@routinebox/shared";
import { api } from "@/lib/api";

export const cartApi = {
  get: () => api<CartDto>("/cart"),
  put: (input: CartItemInput) => api<CartDto>("/cart/items", { method: "PUT", body: JSON.stringify(input) }),
  remove: (productId: string) => api<CartDto>(`/cart/items/${productId}`, { method: "DELETE" }),
};
