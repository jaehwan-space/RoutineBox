import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATEGORY_LABELS, formatKrw, type ProductDto } from "@routinebox/shared";
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
      <p className={styles.crumb}>홈 › {CATEGORY_LABELS[product.category]} › {product.name}</p>
      <div className={styles.layout}>
        <div className={styles.gallery}>
          <ProductThumb product={product} className={styles.image} />
          <span className={styles.badge}>구독 {product.subscriptionDiscount}% 할인</span>
        </div>
        <div className={styles.info}>
          <span className={styles.category}>{CATEGORY_LABELS[product.category]}</span>
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.description}>{product.description}</p>
          <div>
            <div className={styles.priceRow}>
              <span className={styles.discount}>{product.subscriptionDiscount}%</span>
              <strong className={styles.price}>{formatKrw(product.subscriptionPrice)}</strong>
              <s className={styles.listPrice}>{formatKrw(product.price)}</s>
            </div>
            <p className={styles.priceNote}>구독가 · 회당 결제 금액은 수량에 따라 달라져요</p>
          </div>
          <dl className={styles.facts}>
            <div><dt>배송비</dt><dd>무료</dd></div>
            <div><dt>결제일</dt><dd>배송일 3일 전 자동 결제 · 하루 전 알림</dd></div>
            <div><dt>추천 주기</dt><dd>{weeks}주 (7~90일 사이 직접 설정 가능)</dd></div>
            <div><dt>변경·해지</dt><dd>언제든 건너뛰기·일시정지·주기 변경·해지</dd></div>
            <div><dt>재고</dt><dd>{product.stock > 0 ? `${product.stock}개` : "일시 품절"}</dd></div>
          </dl>
          <Suspense><SubscribeCta product={product} /></Suspense>
        </div>
      </div>
    </article>
  );
}
