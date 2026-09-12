import type { BillingAuthInput, PaymentMethodDto } from "@routinebox/shared";
import { api } from "@/lib/api";

export const paymentApi = {
  list: () => api<PaymentMethodDto[]>("/payment-methods"),
  billingAuth: (input: BillingAuthInput) => api<PaymentMethodDto>("/payment-methods/billing-auth", { method: "POST", body: JSON.stringify(input) }),
  mock: () => api<PaymentMethodDto>("/payment-methods/mock", { method: "POST" }),
  remove: (id: string) => api<void>(`/payment-methods/${id}`, { method: "DELETE" }),
};

export const customerKeyFor = (userId: string) => `cust_${userId}`;
export const MOCK_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_MOCK === "true";
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
