import type { Metadata } from "next";
import { AdminSubscriptions } from "@/features/admin/AdminSubscriptions";

export const metadata: Metadata = { title: "구독 현황" };

export default function AdminSubscriptionsPage() {
  return <AdminSubscriptions />;
}
