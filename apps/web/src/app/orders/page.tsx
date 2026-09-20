import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { OrdersView } from "@/features/order/OrdersView";

export const metadata: Metadata = { title: "주문 내역" };

export default function OrdersPage() {
  return <RequireAuth><OrdersView /></RequireAuth>;
}
