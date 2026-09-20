"use client";

import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, formatDateTime, formatKrw, formatShortDate } from "@routinebox/shared";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { cx } from "@/lib/cx";
import { ORDER_BADGE, useOrder } from "./useOrders";
import styles from "./Orders.module.scss";

const STEPS = [
  { key: "PREPARING", label: "배송 준비", Icon: PackageCheck },
  { key: "SHIPPED", label: "배송 중", Icon: Truck },
  { key: "DELIVERED", label: "배송 완료", Icon: CheckCircle2 },
] as const;

export function OrderDetail({ id }: { id: string }) {
  const { data: o, isPending, error } = useOrder(id);
  if (isPending) return <section className={styles.page}><Skeleton height={200} /></section>;
  if (error || !o) return <section className={styles.page}><p>주문을 찾을 수 없어요.</p><Button href="/orders" variant="secondary">주문 내역으로</Button></section>;
  const stepIndex = STEPS.findIndex((s) => s.key === o.deliveryStatus);

  return (
    <section className={styles.page}>
      <Button href="/orders" variant="ghost" size="sm">← 주문 내역</Button>
      <Card>
        <div className={styles.row}>
          <div className={styles.main}>
            <h1 className={styles.name}>{o.product.name} <span className={styles.meta}>× {o.quantity}</span></h1>
            <span className={styles.meta}>주문번호 {o.orderKey}</span>
          </div>
          <div className={styles.side}>
            <span className={styles.amount}>{formatKrw(o.amount)}</span>
            <Badge status={ORDER_BADGE[o.status]} icon={false}>{ORDER_STATUS_LABELS[o.status]}</Badge>
          </div>
        </div>
      </Card>

      {o.status === "PAID" && (
        <Card>
          <h2 className={styles.sectionTitle}>배송 · {DELIVERY_STATUS_LABELS[o.deliveryStatus]}</h2>
          <ol className={styles.steps} aria-label="배송 진행 단계">
            {STEPS.map((s, i) => (
              <li key={s.key} className={cx(styles.step, i < stepIndex && styles.stepDone, i === stepIndex && styles.stepCurrent)} aria-current={i === stepIndex ? "step" : undefined}>
                <s.Icon aria-hidden />{s.label}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card>
        <h2 className={styles.sectionTitle}>결제 정보</h2>
        <dl className={styles.rows}>
          <div><dt>결제일</dt><dd>{formatShortDate(o.billingDate)}</dd></div>
          <div><dt>배송 예정일</dt><dd>{formatShortDate(o.deliveryDate)}</dd></div>
          <div><dt>결제 수단</dt><dd>{o.paymentMethod ? `${o.paymentMethod.cardCompany} **** ${o.paymentMethod.cardLast4}` : "-"}</dd></div>
          <div><dt>결제 결과</dt><dd>{o.payment ? (o.payment.status === "APPROVED" ? `승인 ${o.payment.approvedAt ? formatDateTime(o.payment.approvedAt) : ""}` : <span className={styles.danger}>실패 · {o.payment.failReason ?? "승인 거절"}</span>) : "-"}</dd></div>
          <div><dt>배송 주기</dt><dd>{o.cycleDays}일마다</dd></div>
        </dl>
      </Card>
      <Button href={`/subscriptions/${o.subscriptionId}`} variant="secondary">이 구독 관리하기</Button>
    </section>
  );
}
