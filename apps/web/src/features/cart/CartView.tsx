"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatKrw } from "@routinebox/shared";
import { Button, Card, EmptyState, IconButton, Skeleton, Stepper } from "@/components/ui";
import { useCartActions, useCartLines } from "./useCart";
import styles from "./CartView.module.scss";

export function CartView() {
  const { lines, total, itemCount, isGuest, isLoading } = useCartLines();
  const { setQuantity, remove } = useCartActions();

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>장바구니 <span className={styles.count}>{itemCount}개</span></h1>
      {isGuest && lines.length > 0 && (
        <p className={styles.notice}>로그인하면 장바구니가 계정에 저장되고 구독을 시작할 수 있어요. <Link href="/login?next=/cart">로그인</Link></p>
      )}
      {isLoading ? (
        <div className={styles.list}><Skeleton height={96} /><Skeleton height={96} /></div>
      ) : lines.length === 0 ? (
        <Card padding="none">
          <EmptyState icon={<ShoppingCart />} title="장바구니가 비어 있어요" description="상품을 담고 배송 주기를 정하면 정기배송이 시작됩니다." action={<Button href="/products">상품 보러 가기</Button>} />
        </Card>
      ) : (
        <div className={styles.layout}>
          <ul className={styles.list}>
            {lines.map((l) => (
              <Card as="li" key={l.productId} padding="sm" className={styles.line}>
                <div className={styles.lineMain}>
                  <Link href={`/products/${l.productId}`} className={styles.name}>{l.name}</Link>
                  <p className={styles.unit}>구독가 {formatKrw(l.unitPrice)}</p>
                </div>
                <div className={styles.lineControls}>
                  <Stepper value={l.quantity} onChange={(q) => setQuantity(l.productId, q)} min={1} max={20} size="sm" aria-label={`${l.name} 수량`} />
                  <strong className={styles.lineTotal}>{formatKrw(l.lineTotal)}</strong>
                  <IconButton aria-label={`${l.name} 삭제`} size="sm" onClick={() => remove(l.productId)}><Trash2 /></IconButton>
                </div>
                <Button href={`/products/${l.productId}`} variant="ghost" size="sm" className={styles.subscribe}>구독 설정</Button>
              </Card>
            ))}
          </ul>
          <Card className={styles.summary}>
            <h2 className={styles.summaryTitle}>담은 상품</h2>
            <dl className={styles.summaryRows}>
              <div><dt>상품 {itemCount}개</dt><dd>{formatKrw(total)}</dd></div>
              <div><dt>배송비</dt><dd>무료</dd></div>
              <div className={styles.summaryTotal}><dt>회당 결제 예상</dt><dd>{formatKrw(total)}</dd></div>
            </dl>
            <p className={styles.summaryHelp}>상품마다 배송 주기를 따로 정할 수 있어요. 각 상품의 ‘구독 설정’에서 시작합니다.</p>
          </Card>
        </div>
      )}
    </section>
  );
}
