"use client";

import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, formatKrw, formatShortDate } from "@routinebox/shared";
import { Badge, Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { DELIVERY_BADGE, ORDER_BADGE, useOrders } from "./useOrders";
import styles from "./Orders.module.scss";

export function OrdersView() {
  const [page, setPage] = useState(1);
  const { data, isPending } = useOrders(page);
  const last = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>주문 내역</h1>
      {isPending ? (
        <div className={styles.list}><Skeleton height={96} /><Skeleton height={96} /></div>
      ) : !data || data.items.length === 0 ? (
        <Card padding="none"><EmptyState icon={<PackageSearch />} title="아직 주문이 없어요" description="구독의 결제일이 되면 자동으로 결제되고 여기에 회차가 쌓여요." action={<Button href="/subscriptions" variant="secondary">내 구독 보기</Button>} /></Card>
      ) : (
        <>
          <ul className={styles.list}>
            {data.items.map((o) => (
              <Card as="li" key={o.id} padding="sm" className={styles.row}>
                <div className={styles.main}>
                  <Link href={`/orders/${o.id}`} className={styles.name}>{o.product.name} <span className={styles.meta}>× {o.quantity}</span></Link>
                  <span className={styles.meta}>결제 {formatShortDate(o.billingDate)} · 배송 예정 {formatShortDate(o.deliveryDate)}</span>
                </div>
                <div className={styles.side}>
                  <span className={styles.amount}>{formatKrw(o.amount)}</span>
                  <div className={styles.badges}>
                    <Badge status={ORDER_BADGE[o.status]} icon={false}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    {o.status === "PAID" && <Badge status={DELIVERY_BADGE[o.deliveryStatus]} icon={false}>{DELIVERY_STATUS_LABELS[o.deliveryStatus]}</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </ul>
          {last > 1 && (
            <nav className={styles.pager} aria-label="페이지">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
              <span aria-current="page">{page} / {last}</span>
              <Button variant="secondary" size="sm" disabled={page >= last} onClick={() => setPage((p) => p + 1)}>다음</Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
