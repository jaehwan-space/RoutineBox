"use client";

import { useState } from "react";
import { SUBSCRIPTION_STATUSES, SUBSCRIPTION_STATUS_LABELS, formatDateTime, formatKrw, formatShortDate, type SubscriptionStatus } from "@routinebox/shared";
import { Badge, Button, Card, Input, Select, Skeleton } from "@/components/ui";
import { STATUS_BADGE } from "@/features/subscription/useSubscriptions";
import { useAdminSubscriptions } from "./useAdmin";
import styles from "./Admin.module.scss";

export function AdminSubscriptions() {
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, isPending } = useAdminSubscriptions({ status: status || undefined, q: q || undefined, page });
  const last = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>구독 <span className={styles.subtitle}>{data ? `${data.total}건` : ""}</span></h1>
        <div className={styles.toolbar}>
          <Select aria-label="구독 상태" value={status} onChange={(e) => { setStatus(e.target.value as SubscriptionStatus | ""); setPage(1); }} className={styles.toolbarField}>
            <option value="">상태 전체</option>
            {SUBSCRIPTION_STATUSES.map((s) => <option key={s} value={s}>{SUBSCRIPTION_STATUS_LABELS[s]}</option>)}
          </Select>
          <Input placeholder="회원·상품 검색" aria-label="검색" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={styles.toolbarField} />
        </div>
      </div>
      {isPending || !data ? <Skeleton height={240} /> : (
        <Card padding="none" className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>상태</th><th>회원</th><th>상품</th><th>주기</th><th className="num">회당 금액</th><th>다음 결제</th><th>카드</th><th>생성</th></tr></thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.id}>
                  <td><Badge status={STATUS_BADGE[s.status]} />{s.status === "PAYMENT_FAILED" && <><br /><span className={styles.danger}>실패 {s.failCount}/3 · 재시도 {s.nextRetryAt ? formatDateTime(s.nextRetryAt) : "-"}</span></>}{s.status === "CANCELLED" && s.cancelledReason === "PAYMENT_FAILED" && <><br /><span className={styles.muted}>결제 실패 자동 해지</span></>}</td>
                  <td className="wrap">{s.user.name}<br /><span className={styles.muted}>{s.user.email}</span></td>
                  <td className="wrap">{s.product.name} × {s.quantity}</td>
                  <td>{s.cycleDays}일</td>
                  <td className="num">{formatKrw(s.amount)}</td>
                  <td>{s.nextBillingDate ? formatShortDate(s.nextBillingDate) : <span className={styles.muted}>-</span>}</td>
                  <td>{s.paymentMethod ? `${s.paymentMethod.cardCompany} ${s.paymentMethod.cardLast4}` : <span className={styles.muted}>미등록</span>}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
              {data.items.length === 0 && <tr><td colSpan={8} className={styles.muted}>조건에 맞는 구독이 없어요.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      {last > 1 && (
        <nav className={styles.pager} aria-label="페이지">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
          <span aria-current="page">{page} / {last}</span>
          <Button variant="secondary" size="sm" disabled={page >= last} onClick={() => setPage((p) => p + 1)}>다음</Button>
        </nav>
      )}
    </>
  );
}
