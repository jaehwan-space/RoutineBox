"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDays, billingDateFor, formatKrw, formatShortDate, subscriptionAmount, todayKst, BILLING_LEAD_DAYS, type ProductDto } from "@routinebox/shared";
import { Button, Dialog, Input, Select, useToast } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";
import { MOCK_ENABLED } from "@/features/payment/api";
import { usePaymentMethodActions, usePaymentMethods } from "@/features/payment/usePaymentMethods";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { subscriptionApi } from "./api";
import { CycleFields } from "./CycleFields";
import { SUBS_KEY } from "./useSubscriptions";
import styles from "./SubscribeDialog.module.scss";

export function SubscribeDialog({ product, open, onClose }: { product: ProductDto; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useMe();
  const { data: methods } = usePaymentMethods();
  const { mock } = usePaymentMethodActions();
  const earliest = addDays(todayKst(), BILLING_LEAD_DAYS);
  const [quantity, setQuantity] = useState(1);
  const [cycleDays, setCycleDays] = useState(product.recommendedCycleDays);
  const [firstDeliveryDate, setFirstDeliveryDate] = useState(earliest);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const amount = subscriptionAmount(product.price, product.subscriptionDiscount, quantity);
  const billingDate = firstDeliveryDate >= earliest ? billingDateFor(firstDeliveryDate) : null;
  const selectedPm = paymentMethodId || methods?.[0]?.id || "";
  const returnTo = `/products/${product.id}?subscribe=1`;

  const submit = async () => {
    if (!me) { router.push(`/login?next=${encodeURIComponent(returnTo)}`); return; }
    if (!billingDate) { toast.error(`첫 배송일은 ${earliest} 이후여야 해요.`); return; }
    setSubmitting(true);
    try {
      const created = await subscriptionApi.create({ productId: product.id, quantity, cycleDays, firstDeliveryDate, paymentMethodId: selectedPm || undefined });
      await qc.invalidateQueries({ queryKey: SUBS_KEY });
      toast.success(created.status === "ACTIVE" ? `구독을 시작했어요. 첫 결제일은 ${created.nextBillingDate} 입니다.` : "구독을 만들었어요. 카드를 등록하면 시작됩니다.");
      onClose();
      router.push("/subscriptions");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "구독을 만들지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="구독 설정"
      description={product.name}
      footer={<><Button variant="ghost" onClick={onClose}>취소</Button><Button onClick={submit} loading={submitting}>{me ? "구독 시작하기" : "로그인하고 구독하기"}</Button></>}
    >
      <div className={styles.body}>
        <CycleFields quantity={quantity} onQuantity={setQuantity} cycleDays={cycleDays} onCycle={setCycleDays} recommended={product.recommendedCycleDays} />
        <Input label="첫 배송일" type="date" min={earliest} value={firstDeliveryDate} onChange={(e) => setFirstDeliveryDate(e.target.value)} error={!billingDate ? `${earliest} 이후로 선택해 주세요.` : undefined} />
        <dl className={styles.summary}>
          <div><dt>회당 결제 금액</dt><dd><strong>{formatKrw(amount)}</strong> <small>{product.subscriptionDiscount}% 할인 적용</small></dd></div>
          <div><dt>다음 결제일</dt><dd>{billingDate ? `${formatShortDate(billingDate)} · 배송 ${BILLING_LEAD_DAYS}일 전 자동결제` : "-"}</dd></div>
        </dl>
        {me && (
          methods && methods.length > 0 ? (
            <Select label="결제 수단" value={selectedPm} onChange={(e) => setPaymentMethodId(e.target.value)}>
              {methods.map((m) => <option key={m.id} value={m.id}>{m.cardCompany} **** {m.cardLast4}</option>)}
            </Select>
          ) : (
            <div className={styles.noCard}>
              <p>등록된 카드가 없어요. 카드 없이 만들면 구독은 ‘카드 미등록’ 상태로 저장됩니다.</p>
              <div className={styles.noCardActions}>
                <Button href={`/account/payment-methods?returnTo=${encodeURIComponent(returnTo)}`} variant="secondary" size="sm">카드 등록하기</Button>
                {MOCK_ENABLED && <Button variant="ghost" size="sm" onClick={() => mock.mutate()} loading={mock.isPending}>테스트 카드 등록</Button>}
              </div>
            </div>
          )
        )}
        <p className={styles.help}>결제 하루 전 알림을 보내드리며, 언제든 건너뛰기·일시정지·해지할 수 있어요.</p>
      </div>
    </Dialog>
  );
}
