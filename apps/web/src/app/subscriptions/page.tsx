import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { SubscriptionsView } from "@/features/subscription/SubscriptionsView";

export const metadata: Metadata = { title: "내 구독" };

export default function SubscriptionsPage() {
  return <RequireAuth><SubscriptionsView /></RequireAuth>;
}
