"use client";

import { useState } from "react";
import { DELIVERY_STATUSES, DELIVERY_STATUS_LABELS, ORDER_STATUSES, ORDER_STATUS_LABELS, formatKrw, formatShortDate, type DeliveryStatus, type OrderStatus } from "@routinebox/shared";
import { Badge, Button, Card, Input, Select, Skeleton } from "@/components/ui";
import { ORDER_BADGE } from "@/features/order/useOrders";
import { useAdminActions, useAdminOrders } from "./useAdmin";
import styles from "./Admin.module.scss";

export function AdminOrders() {
  const [status, setStatus] = useState<OrderStatus | "">("PAID");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, isPending } = useAdminOrders({ status: status || undefined, deliveryStatus: deliveryStatus || undefined, q: q || undefined, page });
  const { updateDelivery } = useAdminActions();
  const last = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>주문·배송 <span className={styles.subtitle}>{data ? `${data.total}건` : ""}</span></h1>
        <div className={styles.toolbar}>
          <Select aria-label="결제 상태" value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | ""); setPage(1); }} className={styles.toolbarField}>
            <option value="">결제 상태 전체</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </Select>
          <Select aria-label="배송 상태" value={deliveryStatus} onChange={(e) => { setDeliveryStatus(e.target.value as DeliveryStatus | ""); setPage(1); }} className={styles.toolbarField}>
            <option value="">배송 상태 전체</option>
            {DELIVERY_STATUSES.map((s) => <option key={s} value={s}>{DELIVERY_STATUS_LABELS[s]}</option>)}
          </Select>
          <Input placeholder="회원·상품·주문번호 검색" aria-label="검색" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={styles.toolbarField} />
        </div>
      </div>
      {isPending || !data ? <Skeleton height={240} /> : (
        <Card padding="none" className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>결제일</th><th>회원</th><th>상품</th><th className="num">금액</th><th>결제</th><th>배송 예정</th><th>배송 상태</th></tr></thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td>{formatShortDate(o.billingDate)}</td>
                  <td className="wrap">{o.user.name}<br /><span className={styles.muted}>{o.user.email}</span></td>
                  <td className="wrap">{o.product.name} × {o.quantity}<br /><span className={styles.muted}>{o.orderKey}</span></td>
                  <td className="num">{formatKrw(o.amount)}</td>
                  <td><Badge status={ORDER_BADGE[o.status]} icon={false}>{ORDER_STATUS_LABELS[o.status]}</Badge>{o.payment?.failReason && <><br /><span className={styles.danger}>{o.payment.failReason}</span></>}</td>
                  <td>{formatShortDate(o.deliveryDate)}</td>
                  <td>
                    {o.status === "PAID" ? (
                      <Select aria-label={`${o.user.name} ${o.product.name} 배송 상태`} value={o.deliveryStatus} disabled={updateDelivery.isPending} className={styles.inlineSelect}
                        onChange={(e) => updateDelivery.mutate({ id: o.id, deliveryStatus: e.target.value as DeliveryStatus })}>
                        {DELIVERY_STATUSES.map((s) => <option key={s} value={s}>{DELIVERY_STATUS_LABELS[s]}</option>)}
                      </Select>
                    ) : <span className={styles.muted}>-</span>}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && <tr><td colSpan={7} className={styles.muted}>조건에 맞는 주문이 없어요.</td></tr>}
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
