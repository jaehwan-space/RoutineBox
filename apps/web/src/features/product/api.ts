import type { Paginated, ProductDto, ProductQuery } from "@routinebox/shared";
import { api } from "@/lib/api";

export function productQueryString(q: Partial<ProductQuery>): string {
  const params = new URLSearchParams();
  if (q.category) params.set("category", q.category);
  if (q.q) params.set("q", q.q);
  if (q.page && q.page > 1) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const productApi = {
  list: (q: Partial<ProductQuery>) => api<Paginated<ProductDto>>(`/products${productQueryString(q)}`),
  get: (id: string) => api<ProductDto>(`/products/${id}`),
};
