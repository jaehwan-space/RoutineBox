"use client";

import { PackageOpen } from "lucide-react";
import { useState } from "react";
import { SUBSCRIPTION_STATUS_LABELS, daysBetween, formatKrw, formatShortDate, todayKst, type SubscriptionStatus } from "@routinebox/shared";
import { Button, Card, Chip, EmptyState, Skeleton } from "@/components/ui";
import { SubscriptionCard } from "./SubscriptionCard";
import { useSubscriptions } from "./useSubscriptions";
import styles from "./SubscriptionsView.module.scss";

const FILTERS: Array<SubscriptionStatus | "ALL"> = ["ALL", "ACTIVE", "PAUSED", "PAYMENT_FAILED", "PENDING", "CANCELLED"];

export function SubscriptionsView() {
  const { data, isPending } = useSubscriptions();
  const [filter, setFilter] = useState<SubscriptionStatus | "ALL">("ALL");
  const items = data?.items ?? [];
  const shown = filter === "ALL" ? items.filter((s) => s.status !== "CANCELLED") : items.filter((s) => s.status === filter);
  const ended = filter === "ALL" ? items.filter((s) => s.status === "CANCELLED") : [];
  const counts = (s: SubscriptionStatus | "ALL") => (s === "ALL" ? items.length : items.filter((x) => x.status === s).length);
  const today = todayKst();
  const nextDue = items.filter((s) => s.status === "ACTIVE" && s.nextBillingDate).map((s) => s.nextBillingDate!).sort()[0];
  const nextDays = nextDue ? daysBetween(today, nextDue) : null;

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>내 구독</h1>
      {isPending ? (
        <><Skeleton height={96} /><Skeleton height={140} /></>
      ) : !data || data.items.length === 0 ? (
        <Card padding="none"><EmptyState icon={<PackageOpen />} title="아직 구독이 없어요" description="상품을 고르고 배송 주기를 정하면 여기에서 관리할 수 있어요." action={<Button href="/products">상품 보러 가기</Button>} /></Card>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.tilePrimary}><span>이번 달 예정 결제</span><strong>{formatKrw(data.monthlyDue)}</strong><small>진행 중인 구독 기준</small></div>
            <div className={styles.tile}><span>진행 중인 구독</span><strong>{data.activeCount}개</strong><small>일시정지 {counts("PAUSED")} · 결제 실패 {counts("PAYMENT_FAILED")}</small></div>
            <div className={styles.tile}><span>가장 가까운 결제</span><strong>{nextDays === null ? "-" : nextDays === 0 ? "오늘" : `D-${nextDays}`}</strong><small>{nextDue ? formatShortDate(nextDue) : "예정된 결제가 없어요"}</small></div>
          </div>
          <div className={styles.filters} role="group" aria-label="상태 필터">
            {FILTERS.filter((f) => f === "ALL" || counts(f) > 0).map((f) => (
              <Chip key={f} size="sm" selected={filter === f} onClick={() => setFilter(f)}>{f === "ALL" ? "전체" : SUBSCRIPTION_STATUS_LABELS[f]} {counts(f)}</Chip>
            ))}
          </div>
          <ul className={styles.list}>{shown.map((s) => <SubscriptionCard key={s.id} sub={s} />)}</ul>
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
