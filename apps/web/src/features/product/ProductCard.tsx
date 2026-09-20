import Link from "next/link";
import { formatKrw, type ProductDto } from "@routinebox/shared";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { cx } from "@/lib/cx";
import styles from "./ProductCard.module.scss";

/** 상품 이미지 자리. 이미지가 없으면 카테고리 틴트 위에 상품명을 서체로 보여준다. */
export function ProductThumb({ product, className }: { product: ProductDto; className?: string }) {
  return (
    <div className={cx(styles.thumb, className)} style={{ background: `var(--tint-${product.category})` }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- 외부 URL 자리표시자, 최적화는 이미지 업로드 도입 시 */}
      {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className={styles.thumbLabel}>{product.name}</span>}
    </div>
  );
}

export function ProductCard({ product }: { product: ProductDto }) {
  const weeks = Math.round(product.recommendedCycleDays / 7);
  return (
    <article className={styles.card}>
      <Link href={`/products/${product.id}`} className={styles.link} aria-label={`${product.name} 상세 보기`}>
        <ProductThumb product={product} />
        <span className={styles.badge}>구독 {product.subscriptionDiscount}%</span>
        {product.stock <= 0 && <span className={styles.soldOut}>일시 품절</span>}
      </Link>
      <AddToCartButton product={product} fullWidth />
      <h3 className={styles.name}><Link href={`/products/${product.id}`}>{product.name}</Link></h3>
      <p className={styles.price}>
        <span className={styles.discount}>{product.subscriptionDiscount}%</span>
        <strong>{formatKrw(product.subscriptionPrice)}</strong>
        <s className={styles.listPrice}>{formatKrw(product.price)}</s>
      </p>
      <p className={styles.meta}>추천 주기 {weeks}주 · 배송비 무료</p>
    </article>
  );
}
