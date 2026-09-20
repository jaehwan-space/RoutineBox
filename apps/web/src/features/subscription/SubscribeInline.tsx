"use client";

import type { ProductDto } from "@routinebox/shared";
import { Button } from "@/components/ui";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { SubscribeFields } from "./SubscribeFields";
import { useSubscribeForm } from "./useSubscribeForm";
import styles from "./SubscribeDialog.module.scss";

/** 데스크톱: 상품 상세 오른쪽에 바로 보이는 구독 설정 패널 */
export function SubscribeInline({ product }: { product: ProductDto }) {
  const form = useSubscribeForm(product);
  return (
    <section className={styles.inline} aria-label="구독 설정">
      <h2 className={styles.inlineTitle}>구독 설정</h2>
      <SubscribeFields product={product} form={form} />
      <div className={styles.inlineActions}>
        <AddToCartButton product={product} size="lg" variant="secondary" />
        <Button size="lg" onClick={form.submit} loading={form.submitting} disabled={product.stock <= 0}>{form.me ? "구독 시작하기" : "로그인하고 구독하기"}</Button>
      </div>
    </section>
  );
}
