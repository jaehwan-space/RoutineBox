import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { NotificationsView } from "@/features/notification/NotificationsView";

export const metadata: Metadata = { title: "알림" };

export default function NotificationsPage() {
  return <RequireAuth><NotificationsView /></RequireAuth>;
}
