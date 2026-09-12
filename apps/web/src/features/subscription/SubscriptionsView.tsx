"use client";

import { PackageOpen } from "lucide-react";
import { formatKrw } from "@routinebox/shared";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { SubscriptionCard } from "./SubscriptionCard";
import { useSubscriptions } from "./useSubscriptions";
import styles from "./SubscriptionsView.module.scss";

export function SubscriptionsView() {
  const { data, isPending } = useSubscriptions();
  const live = data?.items.filter((s) => s.status !== "CANCELLED") ?? [];
  const ended = data?.items.filter((s) => s.status === "CANCELLED") ?? [];

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>내 구독</h1>
      {isPending ? (
        <><Skeleton height={96} /><Skeleton height={140} /></>
      ) : !data || data.items.length === 0 ? (
        <Card padding="none"><EmptyState icon={<PackageOpen />} title="아직 구독이 없어요" description="상품을 고르고 배송 주기를 정하면 여기에서 관리할 수 있어요." action={<Button href="/products">상품 보러 가기</Button>} /></Card>
      ) : (
        <>
          <Card className={styles.summary}>
            <div><span className={styles.summaryLabel}>이번 달 예정 결제</span><strong className={styles.summaryValue}>{formatKrw(data.monthlyDue)}</strong></div>
            <div><span className={styles.summaryLabel}>진행 중인 구독</span><strong className={styles.summaryValue}>{data.activeCount}개</strong></div>
          </Card>
          <ul className={styles.list}>{live.map((s) => <SubscriptionCard key={s.id} sub={s} />)}</ul>
          {ended.length > 0 && (
            <details className={styles.ended}>
              <summary>해지한 구독 {ended.length}개</summary>
              <ul className={styles.list}>{ended.map((s) => <SubscriptionCard key={s.id} sub={s} />)}</ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
