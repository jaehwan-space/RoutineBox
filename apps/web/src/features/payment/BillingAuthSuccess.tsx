"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui";
import { usePaymentMethodActions } from "./usePaymentMethods";

/** 토스 카드 등록창 successUrl: authKey·customerKey 를 서버로 보내 빌링키를 발급받는다. */
export function BillingAuthSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const { billingAuth } = usePaymentMethodActions();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const authKey = params.get("authKey");
    const customerKey = params.get("customerKey");
    const returnTo = params.get("returnTo");
    const back = returnTo && returnTo.startsWith("/") ? returnTo : "/account/payment-methods";
    if (!authKey || !customerKey) { router.replace("/account/payment-methods?error=billing_failed"); return; }
    billingAuth.mutate({ authKey, customerKey }, {
      onSuccess: () => router.replace(back),
      onError: () => router.replace("/account/payment-methods?error=billing_failed"),
    });
  }, [params, router, billingAuth]);

  return <div style={{ padding: 24 }}><Skeleton height={120} /></div>;
}
