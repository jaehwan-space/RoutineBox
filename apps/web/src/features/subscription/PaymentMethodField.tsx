"use client";

import type { PaymentMethodDto } from "@routinebox/shared";
import { Button, Select } from "@/components/ui";
import { MOCK_ENABLED } from "@/features/payment/api";
import styles from "./SubscribeDialog.module.scss";

/** 결제 수단 선택. 카드가 없으면 등록 안내(+테스트 카드 등록). 구독 설정 폼과 장바구니 일괄 시작이 같이 쓴다. */
export function PaymentMethodField({ methods, value, onChange, returnTo, mock }: {
  methods: PaymentMethodDto[] | undefined;
  value: string;
  onChange: (paymentMethodId: string) => void;
  /** 카드 등록 페이지에서 돌아올 경로 */
  returnTo: string;
  mock: { mutate: () => void; isPending: boolean };
}) {
  if (methods && methods.length > 0) {
    return (
      <Select label="결제 수단" value={value} onChange={(e) => onChange(e.target.value)}>
        {methods.map((m) => <option key={m.id} value={m.id}>{m.cardCompany} **** {m.cardLast4}</option>)}
      </Select>
    );
  }
  return (
    <div className={styles.noCard}>
      <p>등록된 카드가 없어요. 카드 없이 만들면 구독은 ‘카드 미등록’ 상태로 저장됩니다.</p>
      <div className={styles.noCardActions}>
        <Button href={`/account/payment-methods?returnTo=${encodeURIComponent(returnTo)}`} variant="secondary" size="sm">카드 등록하기</Button>
        {MOCK_ENABLED && <Button variant="ghost" size="sm" onClick={() => mock.mutate()} loading={mock.isPending}>테스트 카드 등록</Button>}
      </div>
    </div>
  );
}
