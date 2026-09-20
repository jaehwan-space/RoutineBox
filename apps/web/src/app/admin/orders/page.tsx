import type { Metadata } from "next";
import { AdminOrders } from "@/features/admin/AdminOrders";

export const metadata: Metadata = { title: "주문·배송 관리" };

export default function AdminOrdersPage() {
  return <AdminOrders />;
}
