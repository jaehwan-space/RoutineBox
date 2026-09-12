import Link from "next/link";
import { CATEGORY_LABELS, formatKrw, type ProductDto } from "@routinebox/shared";
import { Badge, Button, Card } from "@/components/ui";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { cx } from "@/lib/cx";
import styles from "./ProductCard.module.scss";

export function ProductThumb({ product, className }: { product: ProductDto; className?: string }) {
  return (
    <div className={cx(styles.thumb, styles[`cat-${product.category}`], className)} aria-hidden>
      {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className={styles.thumbLabel}>{product.name}</span>}
    </div>
  );
}

export function ProductCard({ product }: { product: ProductDto }) {
  const weeks = Math.round(product.recommendedCycleDays / 7);
  return (
    <Card as="article" padding="none" interactive className={styles.card}>
      <Link href={`/products/${product.id}`} className={styles.link} aria-label={`${product.name} 상세 보기`}>
        <ProductThumb product={product} />
      </Link>
      <div className={styles.body}>
        <div className={styles.meta}>
          <Badge status="accent" icon={false}>구독 시 {product.subscriptionDiscount}% 할인</Badge>
          <span className={styles.category}>{CATEGORY_LABELS[product.category]}</span>
        </div>
        <h3 className={styles.name}><Link href={`/products/${product.id}`}>{product.name}</Link></h3>
        <p className={styles.price}>
          <strong>{formatKrw(product.subscriptionPrice)}</strong>
          <s className={styles.listPrice}>{formatKrw(product.price)}</s>
        </p>
        <p className={styles.cycle}>추천 주기 {weeks}주</p>
        <div className={styles.actions}>
          <AddToCartButton product={product} />
          <Button href={`/products/${product.id}`} size="sm" className={styles.grow}>구독하기</Button>
        </div>
      </div>
    </Card>
  );
}
