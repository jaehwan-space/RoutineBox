import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATEGORY_LABELS, formatKrw, type ProductDto } from "@routinebox/shared";
import { Badge } from "@/components/ui";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { ProductThumb } from "@/features/product/ProductCard";
import { SubscribeCta } from "@/features/subscription/SubscribeCta";
import { serverApiOrNull } from "@/lib/server-api";
import styles from "./page.module.scss";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const product = await serverApiOrNull<ProductDto>(`/products/${id}`);
  return { title: product?.name ?? "상품" };
}

export default async function ProductDetailPage({ params }: Params) {
  const { id } = await params;
  const product = await serverApiOrNull<ProductDto>(`/products/${id}`);
  if (!product) notFound();
  const weeks = Math.round(product.recommendedCycleDays / 7);

  return (
    <article className={styles.page}>
      <ProductThumb product={product} className={styles.image} />
      <div className={styles.info}>
        <div className={styles.meta}>
          <span className={styles.category}>{CATEGORY_LABELS[product.category]}</span>
          <Badge status="accent" icon={false}>구독 시 {product.subscriptionDiscount}% 할인</Badge>
        </div>
        <h1 className={styles.name}>{product.name}</h1>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.priceBox}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>구독가</span>
            <strong className={styles.price}>{formatKrw(product.subscriptionPrice)}</strong>
            <s className={styles.listPrice}>{formatKrw(product.price)}</s>
          </div>
          <p className={styles.cycle}>추천 주기 <strong>{weeks}주</strong> · 결제는 배송 3일 전 · 언제든 건너뛰기·일시정지·해지</p>
        </div>
        <div className={styles.actions}>
          <Suspense><SubscribeCta product={product} /></Suspense>
          <AddToCartButton product={product} size="lg" />
        </div>
        <p className={styles.stock}>{product.stock > 0 ? `재고 ${product.stock}개` : "일시 품절"}</p>
      </div>
    </article>
  );
}
