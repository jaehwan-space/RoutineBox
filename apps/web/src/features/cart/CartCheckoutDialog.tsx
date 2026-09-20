"use client";

import { useState } from "react";
import { addDays, billingDateFor, formatKrw, formatShortDate, todayKst, BILLING_LEAD_DAYS, CYCLE_PRESETS } from "@routinebox/shared";
import { Button, Dialog, Input, Select, useToast } from "@/components/ui";
import { usePaymentMethodActions, usePaymentMethods } from "@/features/payment/usePaymentMethods";
import { PaymentMethodField } from "@/features/subscription/PaymentMethodField";
import { useCartCheckout, type CartLineWithProduct } from "./useCart";
import styles from "./CartCheckoutDialog.module.scss";

/** 카드 등록 후 돌아올 경로: 장바구니에서 이 시트를 바로 다시 연다. */
export const CHECKOUT_RETURN_TO = "/cart?checkout=1";

const cycleLabel = (days: number) => (days % 7 === 0 ? `${days / 7}주` : `${days}일`);
/** 추천 주기 + 프리셋(중복 제거, 오름차순) */
const cycleOptions = (recommended: number) => Array.from(new Set([recommended, ...CYCLE_PRESETS])).sort((a, b) => a - b);

/** 장바구니 일괄 구독 시작 시트: 상품별 배송 주기와 공통 첫 배송일·결제 수단을 정해 한 번에 구독을 만든다. */
export function CartCheckoutDialog({ lines, open, onClose }: { lines: CartLineWithProduct[]; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { data: methods } = usePaymentMethods();
  const { mock } = usePaymentMethodActions();
  const checkout = useCartCheckout();
  const earliest = addDays(todayKst(), BILLING_LEAD_DAYS);
  const [firstDeliveryDate, setFirstDeliveryDate] = useState(earliest);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [cycles, setCycles] = useState<Record<string, number>>({});
  const selectedPm = paymentMethodId || methods?.[0]?.id || "";
  const billingDate = firstDeliveryDate >= earliest ? billingDateFor(firstDeliveryDate) : null;
  const total = lines.reduce((n, l) => n + l.lineTotal, 0);
  const cycleFor = (l: CartLineWithProduct) => cycles[l.productId] ?? l.product.recommendedCycleDays;

  const submit = () => {
    if (!billingDate) { toast.error(`첫 배송일은 ${earliest} 이후여야 해요.`); return; }
    checkout.mutate(
      { firstDeliveryDate, paymentMethodId: selectedPm || undefined, cycles: lines.map((l) => ({ productId: l.productId, cycleDays: cycleFor(l) })) },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="구독 시작"
      description={`담은 상품 ${lines.length}종을 한 번에 구독해요`}
      footer={<><Button variant="ghost" onClick={onClose}>취소</Button><Button onClick={submit} loading={checkout.isPending}>구독 {lines.length}개 시작하기</Button></>}
    >
      <div className={styles.body}>
        <ul className={styles.items} aria-label="구독할 상품">
          {lines.map((l) => (
            <li key={l.productId} className={styles.item}>
              <div className={styles.itemMain}>
                <span className={styles.itemName}>{l.name}</span>
                <span className={styles.itemMeta}>{l.quantity}개 · 회당 {formatKrw(l.lineTotal)}</span>
              </div>
              <Select
                aria-label={`${l.name} 배송 주기`}
                value={cycleFor(l)}
                onChange={(e) => setCycles((c) => ({ ...c, [l.productId]: Number(e.target.value) }))}
                className={styles.cycle}
              >
                {cycleOptions(l.product.recommendedCycleDays).map((d) => (
                  <option key={d} value={d}>{cycleLabel(d)}마다{d === l.product.recommendedCycleDays ? " (추천)" : ""}</option>
                ))}
              </Select>
            </li>
          ))}
        </ul>
        <Input
          label="첫 배송일"
          type="date"
          min={earliest}
          value={firstDeliveryDate}
          onChange={(e) => setFirstDeliveryDate(e.target.value)}
          error={!billingDate ? `${earliest} 이후로 선택해 주세요.` : undefined}
        />
        <dl className={styles.summary}>
          <div><dt>첫 결제 금액</dt><dd><strong>{formatKrw(total)}</strong></dd></div>
          <div><dt>첫 결제일</dt><dd>{billingDate ? `${formatShortDate(billingDate)} · 배송 ${BILLING_LEAD_DAYS}일 전 자동결제` : "-"}</dd></div>
        </dl>
        <PaymentMethodField methods={methods} value={selectedPm} onChange={setPaymentMethodId} returnTo={CHECKOUT_RETURN_TO} mock={mock} />
        <p className={styles.help}>상품마다 구독이 따로 만들어져 정한 주기대로 결제·배송돼요. 결제 하루 전 알림을 보내드리며, 언제든 건너뛰기·일시정지·해지할 수 있어요.</p>
      </div>
    </Dialog>
  );
}
