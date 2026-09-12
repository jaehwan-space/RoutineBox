import type { ActivateSubscriptionInput, CreateSubscriptionInput, ResumeSubscriptionInput, SubscriptionDto, SubscriptionListDto, UpdateSubscriptionInput } from "@routinebox/shared";
import { api } from "@/lib/api";

const post = <T,>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const subscriptionApi = {
  list: () => api<SubscriptionListDto>("/subscriptions"),
  get: (id: string) => api<SubscriptionDto>(`/subscriptions/${id}`),
  create: (input: CreateSubscriptionInput) => post<SubscriptionDto>("/subscriptions", input),
  skip: (id: string) => post<SubscriptionDto>(`/subscriptions/${id}/skip`),
  pause: (id: string) => post<SubscriptionDto>(`/subscriptions/${id}/pause`),
  resume: (id: string, input: ResumeSubscriptionInput = {}) => post<SubscriptionDto>(`/subscriptions/${id}/resume`, input),
  cancel: (id: string) => post<SubscriptionDto>(`/subscriptions/${id}/cancel`),
  activate: (id: string, input: ActivateSubscriptionInput) => post<SubscriptionDto>(`/subscriptions/${id}/activate`, input),
  update: (id: string, input: UpdateSubscriptionInput) => api<SubscriptionDto>(`/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
};
