import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { PaymentMethodsView } from "@/features/payment/PaymentMethodsView";

export const metadata: Metadata = { title: "결제 수단" };

export default function PaymentMethodsPage() {
  return (
    <RequireAuth>
      <Suspense><PaymentMethodsView /></Suspense>
    </RequireAuth>
  );
}
