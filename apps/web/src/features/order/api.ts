import type { OrderDetailDto, OrderListItemDto, Paginated } from "@routinebox/shared";
import { api } from "@/lib/api";
import { qs } from "@/lib/qs";

export const orderApi = {
  list: (page = 1, pageSize = 20) => api<Paginated<OrderListItemDto>>(`/orders${qs({ page, pageSize })}`),
  get: (id: string) => api<OrderDetailDto>(`/orders/${id}`),
};
