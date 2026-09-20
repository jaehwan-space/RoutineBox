"use client";

import { formatKrw, formatShortDate, BILLING_LEAD_DAYS, type ProductDto } from "@routinebox/shared";
import { Button, Input, Select } from "@/components/ui";
import { MOCK_ENABLED } from "@/features/payment/api";
import { CycleFields } from "./CycleFields";
import type { SubscribeForm } from "./useSubscribeForm";
import styles from "./SubscribeDialog.module.scss";

/** 수량·주기·첫 배송일·결제 수단·요약. 인라인 패널과 시트가 공유한다. */
export function SubscribeFields({ product, form }: { product: ProductDto; form: SubscribeForm }) {
  const { me, methods, mock, earliest, quantity, setQuantity, cycleDays, setCycleDays, firstDeliveryDate, setFirstDeliveryDate, selectedPm, setPaymentMethodId, amount, billingDate, returnTo } = form;
  return (
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
  );
}
