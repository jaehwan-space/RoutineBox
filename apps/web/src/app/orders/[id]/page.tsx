import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { OrderDetail } from "@/features/order/OrderDetail";

export const metadata: Metadata = { title: "주문 상세" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RequireAuth><OrderDetail id={id} /></RequireAuth>;
}
