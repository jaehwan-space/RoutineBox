import type {
  AdminDashboardDto, AdminFailedPaymentDto, AdminOrderDto, AdminOrderQuery, AdminSubscriptionDto, AdminSubscriptionQuery,
  BillingRunResult, CreateProductInput, DeliveryStatus, Paginated, ProductAdminDto, UpdateProductInput,
} from "@routinebox/shared";
import { api } from "@/lib/api";
import { qs } from "@/lib/qs";

const post = <T,>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
const patch = <T,>(path: string, body: unknown) => api<T>(path, { method: "PATCH", body: JSON.stringify(body) });

export const adminApi = {
  dashboard: () => api<AdminDashboardDto>("/admin/dashboard"),
  products: (q?: string) => api<Paginated<ProductAdminDto>>(`/admin/products${qs({ q, pageSize: 100 })}`),
  createProduct: (input: CreateProductInput) => post<ProductAdminDto>("/products", input),
  updateProduct: (id: string, input: UpdateProductInput) => patch<ProductAdminDto>(`/products/${id}`, input),
  orders: (query: Partial<AdminOrderQuery>) => api<Paginated<AdminOrderDto>>(`/admin/orders${qs(query)}`),
  updateDelivery: (id: string, deliveryStatus: DeliveryStatus) => patch<AdminOrderDto>(`/admin/orders/${id}/delivery`, { deliveryStatus }),
  subscriptions: (query: Partial<AdminSubscriptionQuery>) => api<Paginated<AdminSubscriptionDto>>(`/admin/subscriptions${qs(query)}`),
  failedPayments: () => api<AdminFailedPaymentDto[]>("/admin/payments/failed"),
  runBilling: (asOf?: string) => post<BillingRunResult>("/internal/billing/run", asOf ? { asOf } : {}),
  runReminders: (asOf?: string) => post<{ asOf: string; sent: number; skipped: number }>("/internal/billing/remind", asOf ? { asOf } : {}),
};
