import type { Metadata } from "next";
import { MyPageShell } from "@/components/layout/MyPageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { NotificationsView } from "@/features/notification/NotificationsView";

export const metadata: Metadata = { title: "알림" };

export default function NotificationsPage() {
  return <RequireAuth><MyPageShell><NotificationsView /></MyPageShell></RequireAuth>;
}
