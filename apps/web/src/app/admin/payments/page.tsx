import type { Metadata } from "next";
import { AdminFailedPayments } from "@/features/admin/AdminFailedPayments";

export const metadata: Metadata = { title: "결제 실패" };

export default function AdminPaymentsPage() {
  return <AdminFailedPayments />;
}
