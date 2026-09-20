import type { NotificationDto } from "@routinebox/shared";
import { api } from "@/lib/api";

export const notificationApi = {
  list: () => api<NotificationDto[]>("/notifications"),
};
