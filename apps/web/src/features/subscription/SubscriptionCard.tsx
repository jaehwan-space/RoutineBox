"use client";

import Link from "next/link";
import { useState } from "react";
import { daysBetween, formatKrw, formatShortDate, todayKst, type SubscriptionDto } from "@routinebox/shared";
import { Badge, Button, Card, Dialog, Select } from "@/components/ui";
import { MOCK_ENABLED } from "@/features/payment/api";
import { usePaymentMethodActions, usePaymentMethods } from "@/features/payment/usePaymentMethods";
import { CycleFields } from "./CycleFields";
import { STATUS_BADGE, useSubscriptionActions } from "./useSubscriptions";
import styles from "./SubscriptionCard.module.scss";

const cycleLabel = (days: number) => (days % 7 === 0 ? `${days / 7}주마다` : `${days}일마다`);

export function SubscriptionCard({ sub }: { sub: SubscriptionDto }) {
  const actions = useSubscriptionActions();
  const { data: methods } = usePaymentMethods();
  const { mock } = usePaymentMethodActions();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [quantity, setQuantity] = useState(sub.quantity);
  const [cycleDays, setCycleDays] = useState(sub.cycleDays);
  const [pmId, setPmId] = useState("");
  const today = todayKst();
  const dLeft = sub.nextBillingDate ? daysBetween(today, sub.nextBillingDate) : null;
  const busy = Object.values(actions).some((m) => m.isPending);
  const selectedPm = pmId || methods?.[0]?.id || "";

  return (
    <Card as="li" className={styles.card}>
      <div className={styles.head}>
        <span className={styles.thumb} style={{ background: `var(--tint-${sub.product.category})` }} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- 외부 URL 자리표시자, 최적화는 이미지 업로드 도입 시 */}
          {sub.product.imageUrl ? <img src={sub.product.imageUrl} alt="" /> : sub.product.name}
        </span>
        <div className={styles.titleWrap}>
          <div className={styles.titleRow}>
            <Link href={`/subscriptions/${sub.id}`} className={styles.title}>{sub.product.name}</Link>
            <Badge status={STATUS_BADGE[sub.status]} />
          </div>
          <span className={styles.meta}>{sub.quantity}개 · {cycleLabel(sub.cycleDays)} · 회당 {formatKrw(sub.amount)}{sub.paymentMethod ? ` · ${sub.paymentMethod.cardCompany} ${sub.paymentMethod.cardLast4}` : ""}</span>
        </div>
        {sub.status === "ACTIVE" && sub.nextBillingDate && (
          <span className={styles.dday}>{dLeft === 0 ? "오늘 결제" : dLeft !== null && dLeft > 0 ? `D-${dLeft}` : "결제 예정"}</span>
        )}
      </div>

      {sub.status === "ACTIVE" && sub.nextBillingDate && (
        <div className={styles.next}>
          <span>결제 {formatShortDate(sub.nextBillingDate)} · 배송 {sub.nextDeliveryDate ? formatShortDate(sub.nextDeliveryDate) : "-"}</span>
        </div>
      )}
      {sub.status === "PAUSED" && <p className={styles.note}>일시정지 중이에요. 재개하면 3일 뒤 결제일로 다시 시작합니다.</p>}
      {sub.status === "PAYMENT_FAILED" && <p className={styles.noteDanger}>카드 승인에 실패했어요. 내일 09:00에 다시 시도합니다 ({sub.failCount}/3).</p>}
      {sub.status === "PENDING" && <p className={styles.note}>카드를 등록하면 구독이 시작돼요.</p>}
      {sub.status === "CANCELLED" && <p className={styles.note}>해지된 구독이에요. 다시 받으려면 새로 구독해 주세요.</p>}

      <div className={styles.actions}>
        {sub.status === "ACTIVE" && (
          <>
            <Button size="sm" variant="secondary" onClick={() => actions.skip.mutate(sub.id)} disabled={busy}>건너뛰기</Button>
            <Button size="sm" variant="secondary" onClick={() => actions.pause.mutate(sub.id)} disabled={busy}>일시정지</Button>
            <Button size="sm" variant="secondary" onClick={() => { setQuantity(sub.quantity); setCycleDays(sub.cycleDays); setEditOpen(true); }} disabled={busy}>주기 변경</Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelOpen(true)} disabled={busy}>해지</Button>
          </>
        )}
        {sub.status === "PAUSED" && (
          <>
            <Button size="sm" onClick={() => actions.resume.mutate(sub.id)} disabled={busy}>재개</Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelOpen(true)} disabled={busy}>해지</Button>
          </>
        )}
        {sub.status === "PENDING" && (
          <>
            {methods && methods.length > 0 ? (
              <>
                <Select aria-label="결제 수단" value={selectedPm} onChange={(e) => setPmId(e.target.value)} className={styles.pmSelect}>
                  {methods.map((m) => <option key={m.id} value={m.id}>{m.cardCompany} **** {m.cardLast4}</option>)}
                </Select>
                <Button size="sm" onClick={() => actions.activate.mutate({ id: sub.id, paymentMethodId: selectedPm })} disabled={busy || !selectedPm}>구독 시작</Button>
              </>
            ) : (
              <>
                <Button size="sm" href={`/account/payment-methods?returnTo=${encodeURIComponent("/subscriptions")}`}>카드 등록 후 시작</Button>
                {MOCK_ENABLED && <Button size="sm" variant="ghost" onClick={() => mock.mutate()} loading={mock.isPending}>테스트 카드 등록</Button>}
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setCancelOpen(true)} disabled={busy}>삭제</Button>
          </>
        )}
        {sub.status === "PAYMENT_FAILED" && (
          <>
            <Button size="sm" href="/account/payment-methods">카드 변경</Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelOpen(true)} disabled={busy}>해지</Button>
          </>
        )}
      </div>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="주기·수량 변경" description={sub.product.name} size="sm"
        footer={<><Button variant="ghost" onClick={() => setEditOpen(false)}>취소</Button><Button onClick={() => actions.update.mutate({ id: sub.id, quantity, cycleDays }, { onSuccess: () => setEditOpen(false) })} loading={actions.update.isPending}>저장</Button></>}>
        <div className={styles.editBody}>
          <CycleFields quantity={quantity} onQuantity={setQuantity} cycleDays={cycleDays} onCycle={setCycleDays} />
          <p className={styles.help}>변경한 금액은 다음 결제부터 적용돼요. 다음 결제일은 그대로예요.</p>
        </div>
      </Dialog>
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title={sub.status === "PENDING" ? "구독을 삭제할까요?" : "구독을 해지할까요?"} description={sub.product.name} size="sm"
        footer={<><Button variant="ghost" onClick={() => setCancelOpen(false)}>돌아가기</Button><Button variant="danger" onClick={() => actions.cancel.mutate(sub.id, { onSuccess: () => setCancelOpen(false) })} loading={actions.cancel.isPending}>{sub.status === "PENDING" ? "삭제" : "해지"}</Button></>}>
        <p className={styles.help}>해지하면 더 이상 결제·배송되지 않아요. 잠시 쉬고 싶다면 일시정지를 쓸 수 있어요.</p>
      </Dialog>
    </Card>
  );
}
