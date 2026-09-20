"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bell, CalendarClock, CheckCircle2, PlayCircle, SkipForward, Truck, XCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { NOTIFICATION_TYPE_LABELS, formatDateTime, type NotificationType } from "@routinebox/shared";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";
import { notificationApi } from "./api";
import styles from "./Notifications.module.scss";

const ICON: Record<NotificationType, LucideIcon> = {
  SUBSCRIPTION_STARTED: PlayCircle, BILLING_D1: CalendarClock, PAYMENT_SUCCESS: CheckCircle2, PAYMENT_FAILED: AlertCircle,
  SHIPPED: Truck, SKIPPED: SkipForward, CANCELLED: XCircle,
};
const DESC: Record<NotificationType, string> = {
  SUBSCRIPTION_STARTED: "구독이 시작되었어요. 첫 결제일에 자동으로 결제됩니다.",
  BILLING_D1: "내일 결제가 예정되어 있어요. 받지 않으려면 건너뛰기를 해 주세요.",
  PAYMENT_SUCCESS: "결제가 완료되어 배송을 준비하고 있어요.",
  PAYMENT_FAILED: "카드 승인에 실패했어요. 내일 09:00에 다시 시도합니다.",
  SHIPPED: "상품이 출발했어요.",
  SKIPPED: "이번 회차를 건너뛰었어요.",
  CANCELLED: "구독이 해지되었어요.",
};

export function NotificationsView() {
  const { data: me } = useMe();
  const { data, isPending } = useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list, enabled: !!me });
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>알림</h1>
      {isPending ? (
        <><Skeleton height={72} /><Skeleton height={72} /></>
      ) : !data || data.length === 0 ? (
        <Card padding="none"><EmptyState icon={<Bell />} title="아직 알림이 없어요" description="결제 예정·완료, 배송 출발 같은 소식이 여기에 쌓여요. 이메일로도 보내드립니다." /></Card>
      ) : (
        <ul className={styles.list}>
          {data.map((n) => {
            const Icon = ICON[n.type];
            const danger = n.type === "PAYMENT_FAILED" || n.type === "CANCELLED";
            return (
              <Card as="li" key={n.id} padding="sm" className={styles.item}>
                <Icon className={danger ? styles.iconDanger : styles.icon} aria-hidden />
                <div className={styles.body}>
                  <strong>{NOTIFICATION_TYPE_LABELS[n.type]}{n.productName ? ` · ${n.productName}` : ""}</strong>
                  <span className={styles.desc}>{DESC[n.type]}</span>
                  <span className={styles.time}>{formatDateTime(n.sentAt)}{n.subscriptionId && <> · <Link href={`/subscriptions/${n.subscriptionId}`}>구독 보기</Link></>}</span>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </section>
  );
}
