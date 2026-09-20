import type { Metadata } from "next";
import { MyPageShell } from "@/components/layout/MyPageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { OrdersView } from "@/features/order/OrdersView";

export const metadata: Metadata = { title: "주문 내역" };

export default function OrdersPage() {
  return <RequireAuth><MyPageShell><OrdersView /></MyPageShell></RequireAuth>;
}
