"use client";

import { formatKrw, formatShortDate } from "@routinebox/shared";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { SubscriptionCard } from "./SubscriptionCard";
import { useSubscription } from "./useSubscriptions";
import styles from "./SubscriptionsView.module.scss";

const ORDER_LABEL = { PENDING: "결제 대기", PAID: "결제 완료", FAILED: "결제 실패", CANCELLED: "취소" } as const;
const DELIVERY_LABEL = { PREPARING: "준비 중", SHIPPED: "배송 중", DELIVERED: "배송 완료" } as const;

export function SubscriptionDetail({ id }: { id: string }) {
  const { data: sub, isPending, error } = useSubscription(id);
  if (isPending) return <section className={styles.page}><Skeleton height={160} /></section>;
  if (error || !sub) return <section className={styles.page}><p>구독을 찾을 수 없어요.</p><Button href="/subscriptions" variant="secondary">내 구독으로</Button></section>;
  return (
    <section className={styles.page}>
      <Button href="/subscriptions" variant="ghost" size="sm">← 내 구독</Button>
      <ul className={styles.list}><SubscriptionCard sub={sub} /></ul>
      <Card>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>회차 이력</h2>
        {!sub.orders || sub.orders.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>아직 결제된 회차가 없어요. 첫 결제일에 첫 회차가 생성됩니다.</p>
        ) : (
          <ul className={styles.list}>
            {sub.orders.map((o) => (
              <li key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
                <span>결제 {formatShortDate(o.billingDate)} · 배송 {formatShortDate(o.deliveryDate)}</span>
                <span>{formatKrw(o.amount)} · <Badge status={o.status === "PAID" ? "active" : o.status === "FAILED" ? "failed" : "neutral"} icon={false}>{ORDER_LABEL[o.status]}</Badge> {DELIVERY_LABEL[o.deliveryStatus]}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
