import type { Metadata } from "next";
import { MyPageShell } from "@/components/layout/MyPageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { SubscriptionsView } from "@/features/subscription/SubscriptionsView";

export const metadata: Metadata = { title: "내 구독" };

export default function SubscriptionsPage() {
  return <RequireAuth><MyPageShell><SubscriptionsView /></MyPageShell></RequireAuth>;
}
