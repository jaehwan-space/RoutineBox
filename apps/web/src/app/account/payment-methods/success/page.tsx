import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { BillingAuthSuccess } from "@/features/payment/BillingAuthSuccess";

export const metadata: Metadata = { title: "카드 등록 중" };

export default function BillingSuccessPage() {
  return (
    <RequireAuth>
      <Suspense><BillingAuthSuccess /></Suspense>
    </RequireAuth>
  );
}
