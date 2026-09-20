"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatKrw } from "@routinebox/shared";
import { Button, Card, EmptyState, IconButton, Skeleton, Stepper } from "@/components/ui";
import { SubscribeDialog } from "@/features/subscription/SubscribeDialog";
import { CartCheckoutDialog } from "./CartCheckoutDialog";
import { hasProduct, useCartActions, useCartLines } from "./useCart";
import styles from "./CartView.module.scss";

const LOGIN_HREF = "/login?next=/cart";

export function CartView() {
  const router = useRouter();
  const params = useSearchParams();
  const { lines, total, itemCount, isGuest, isLoading } = useCartLines();
  const { setQuantity, remove } = useCartActions();
  // 카드 등록 후 ?checkout=1 / ?subscribe=<productId> 로 돌아오면 열려 있던 시트를 다시 연다.
  const [checkoutOpen, setCheckoutOpen] = useState(params.get("checkout") === "1");
  const [subscribeId, setSubscribeId] = useState<string | null>(params.get("subscribe"));
  const ready = lines.filter(hasProduct);
  const subscribing = ready.find((l) => l.productId === subscribeId);
  const soldOut = ready.filter((l) => l.product.stock <= 0);

  const openSubscribe = (productId: string) => (isGuest ? router.push(LOGIN_HREF) : setSubscribeId(productId));

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>장바구니 <span className={styles.count}>{itemCount}개</span></h1>
      {isGuest && lines.length > 0 && (
        <p className={styles.notice}>로그인하면 장바구니가 계정에 저장되고 구독을 시작할 수 있어요. <Link href={LOGIN_HREF}>로그인</Link></p>
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
            {lines.map((l) => {
              const isSoldOut = !!l.product && l.product.stock <= 0;
              return (
                <Card as="li" key={l.productId} padding="sm" className={styles.line}>
                  <div className={styles.lineMain}>
                    <Link href={`/products/${l.productId}`} className={styles.name}>{l.name}</Link>
                    <p className={styles.unit}>구독가 {formatKrw(l.unitPrice)}{isSoldOut && <span className={styles.soldOut}> · 일시 품절</span>}</p>
                  </div>
                  <div className={styles.lineControls}>
                    <Stepper value={l.quantity} onChange={(q) => setQuantity(l.productId, q)} min={1} max={20} size="sm" aria-label={`${l.name} 수량`} />
                    <strong className={styles.lineTotal}>{formatKrw(l.lineTotal)}</strong>
                    <IconButton aria-label={`${l.name} 삭제`} size="sm" onClick={() => remove(l.productId)}><Trash2 /></IconButton>
                  </div>
                  <Button variant="ghost" size="sm" className={styles.subscribe} onClick={() => openSubscribe(l.productId)} disabled={isSoldOut}>이 상품만 구독</Button>
                </Card>
              );
            })}
          </ul>
          <Card className={styles.summary}>
            <h2 className={styles.summaryTitle}>담은 상품</h2>
            <dl className={styles.summaryRows}>
              <div><dt>상품 {itemCount}개</dt><dd>{formatKrw(total)}</dd></div>
              <div><dt>배송비</dt><dd>무료</dd></div>
              <div className={styles.summaryTotal}><dt>회당 결제 예상</dt><dd>{formatKrw(total)}</dd></div>
            </dl>
            {isGuest ? (
              <Button size="lg" fullWidth href={LOGIN_HREF}>로그인하고 구독하기</Button>
            ) : (
              <Button size="lg" fullWidth onClick={() => setCheckoutOpen(true)} disabled={soldOut.length > 0}>전체 구독 시작하기</Button>
            )}
            {soldOut.length > 0 && (
              <p className={styles.summaryWarn} role="alert">일시 품절된 상품({soldOut.map((l) => l.name).join(", ")})을 빼면 시작할 수 있어요.</p>
            )}
            <p className={styles.summaryHelp}>담은 상품마다 배송 주기를 정해 한 번에 구독을 시작할 수 있어요. 하나만 먼저 시작하려면 ‘이 상품만 구독’을 누르세요.</p>
          </Card>
        </div>
      )}
      {!isGuest && ready.length > 0 && (
        <CartCheckoutDialog lines={ready} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      )}
      {subscribing && (
        <SubscribeDialog
          key={subscribing.productId}
          product={subscribing.product}
          open
          onClose={() => setSubscribeId(null)}
          initialQuantity={subscribing.quantity}
          returnTo={`/cart?subscribe=${subscribing.productId}`}
          onCreated={() => {
            remove(subscribing.productId);
            // 마지막 상품이었으면 내 구독으로, 아니면 장바구니에 남아 다음 상품을 이어서 구독한다.
            if (ready.length <= 1) router.push("/subscriptions");
          }}
        />
      )}
    </section>
  );
}
