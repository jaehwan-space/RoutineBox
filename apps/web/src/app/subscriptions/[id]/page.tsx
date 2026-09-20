import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { SubscriptionDetail } from "@/features/subscription/SubscriptionDetail";

export const metadata: Metadata = { title: "구독 상세" };

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RequireAuth><SubscriptionDetail id={id} /></RequireAuth>;
}
