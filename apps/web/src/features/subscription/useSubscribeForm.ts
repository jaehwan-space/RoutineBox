"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDays, billingDateFor, subscriptionAmount, todayKst, BILLING_LEAD_DAYS, type ProductDto, type SubscriptionDto } from "@routinebox/shared";
import { useToast } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";
import { usePaymentMethodActions, usePaymentMethods } from "@/features/payment/usePaymentMethods";
import { ApiError } from "@/lib/api";
import { subscriptionApi } from "./api";
import { SUBS_KEY } from "./useSubscriptions";

export interface SubscribeFormOptions {
  /** 제출 성공 직후 호출(시트 닫기 등) */
  onDone?: () => void;
  /** 시작 수량(장바구니에서 열 때 담은 수량). 기본 1 */
  initialQuantity?: number;
  /** 로그인·카드 등록 후 돌아올 경로. 기본은 상품 상세(?subscribe=1) */
  returnTo?: string;
  /** 구독이 만들어진 뒤 호출. 지정하면 기본 이동(내 구독)을 하지 않는다. */
  onCreated?: (created: SubscriptionDto) => void | Promise<void>;
}

/** 구독 설정 폼 상태와 제출. 데스크톱 인라인 패널·모바일 시트·장바구니 개별 구독이 같이 쓴다. */
export function useSubscribeForm(product: ProductDto, options: SubscribeFormOptions = {}) {
  const { onDone, initialQuantity = 1, onCreated } = options;
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useMe();
  const { data: methods } = usePaymentMethods();
  const { mock } = usePaymentMethodActions();
  const earliest = addDays(todayKst(), BILLING_LEAD_DAYS);
  const [quantity, setQuantity] = useState(Math.min(20, Math.max(1, initialQuantity)));
  const [cycleDays, setCycleDays] = useState(product.recommendedCycleDays);
  const [firstDeliveryDate, setFirstDeliveryDate] = useState(earliest);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const amount = subscriptionAmount(product.price, product.subscriptionDiscount, quantity);
  const billingDate = firstDeliveryDate >= earliest ? billingDateFor(firstDeliveryDate) : null;
  const selectedPm = paymentMethodId || methods?.[0]?.id || "";
  const returnTo = options.returnTo ?? `/products/${product.id}?subscribe=1`;

  const submit = async () => {
    if (!me) { router.push(`/login?next=${encodeURIComponent(returnTo)}`); return; }
    if (!billingDate) { toast.error(`첫 배송일은 ${earliest} 이후여야 해요.`); return; }
    setSubmitting(true);
    try {
      const created = await subscriptionApi.create({ productId: product.id, quantity, cycleDays, firstDeliveryDate, paymentMethodId: selectedPm || undefined });
      await qc.invalidateQueries({ queryKey: SUBS_KEY });
      toast.success(created.status === "ACTIVE" ? `구독을 시작했어요. 첫 결제일은 ${created.nextBillingDate} 입니다.` : "구독을 만들었어요. 카드를 등록하면 시작됩니다.");
      onDone?.();
      if (onCreated) await onCreated(created);
      else router.push("/subscriptions");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "구독을 만들지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return { me, methods, mock, earliest, quantity, setQuantity, cycleDays, setCycleDays, firstDeliveryDate, setFirstDeliveryDate, selectedPm, setPaymentMethodId, amount, billingDate, submitting, submit, returnTo };
}

export type SubscribeForm = ReturnType<typeof useSubscribeForm>;
