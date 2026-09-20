"use client";

import { CheckCircle2 } from "lucide-react";
import { formatDateTime, formatKrw } from "@routinebox/shared";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { useAdminActions, useFailedPayments } from "./useAdmin";
import styles from "./Admin.module.scss";

export function AdminFailedPayments() {
  const { data, isPending } = useFailedPayments();
  const { runBilling } = useAdminActions();
  return (
    <>
      <div className={styles.head}>
        <div><h1 className={styles.title}>결제 실패 <span className={styles.subtitle}>{data ? `${data.length}건` : ""}</span></h1><p className={styles.subtitle}>매일 09:00 자동 재시도, 3회 연속 실패 시 자동 해지. 회원이 카드를 바꾸면 다음 재시도에서 새 카드로 승인합니다.</p></div>
        <Button variant="secondary" onClick={() => runBilling.mutate(undefined)} loading={runBilling.isPending}>지금 재시도</Button>
      </div>
      {isPending || !data ? <Skeleton height={160} /> : data.length === 0 ? (
        <Card padding="none"><EmptyState icon={<CheckCircle2 />} title="재시도 대기 중인 결제 실패가 없어요" /></Card>
      ) : (
        <Card padding="none" className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>회원</th><th>상품</th><th className="num">금액</th><th>실패</th><th>마지막 실패</th><th>사유</th><th>다음 재시도</th></tr></thead>
            <tbody>
              {data.map((f) => (
                <tr key={f.subscriptionId}>
                  <td className="wrap">{f.user.name}<br /><span className={styles.muted}>{f.user.email}</span></td>
                  <td className="wrap">{f.product.name}</td>
                  <td className="num">{formatKrw(f.amount)}</td>
                  <td className={styles.danger}>{f.failCount}/3</td>
                  <td>{f.lastFailedAt ? formatDateTime(f.lastFailedAt) : "-"}</td>
                  <td className="wrap">{f.lastFailReason ?? "-"}</td>
                  <td>{f.nextRetryAt ? formatDateTime(f.nextRetryAt) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
