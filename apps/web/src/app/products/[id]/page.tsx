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
  return { title: product?.name ?? "상품", description: product?.description };
}

export default async function ProductDetailPage({ params }: Params) {
  const { id } = await params;
  const product = await serverApiOrNull<ProductDto>(`/products/${id}`);
  if (!product) notFound();
  const weeks = Math.round(product.recommendedCycleDays / 7);
  const facts: Array<[string, string | null]> = [
    ["브랜드", product.brand],
    ["중량·용량", product.weight],
    ["판매 단위", product.unitOfSale],
    ["포장 타입", product.packagingType],
    ["배송", product.deliveryType ? `${product.deliveryType} · 배송비 무료` : "배송비 무료"],
    ["원산지", product.origin],
    ["결제일", "배송일 3일 전 자동 결제 · 하루 전 알림"],
    ["추천 주기", `${weeks}주 (7~90일 사이 직접 설정 가능)`],
    ["변경·해지", "언제든 건너뛰기·일시정지·주기 변경·해지"],
    ["재고", product.stock > 0 ? `${product.stock}개` : "일시 품절"],
  ];
  const paragraphs = product.detailDescription.split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className={styles.page}>
      <p className={styles.crumb}>홈 › {CATEGORY_LABELS[product.category]} › {product.name}</p>
      <div className={styles.layout}>
        <div className={styles.gallery}>
          <ProductThumb product={product} className={styles.image} />
          <span className={styles.badge}>구독 {product.subscriptionDiscount}% 할인</span>
        </div>
        <div className={styles.info}>
          <span className={styles.category}>{CATEGORY_LABELS[product.category]}{product.brand ? ` · ${product.brand}` : ""}</span>
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
            {facts.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <Suspense><SubscribeCta product={product} /></Suspense>
        </div>
      </div>

      {(paragraphs.length > 0 || product.detailImages.length > 0 || product.allergy) && (
        <section className={styles.detail} aria-labelledby="detail-title">
          <h2 id="detail-title" className={styles.detailTitle}>상품 설명</h2>
          {paragraphs.map((p, i) => <p key={i} className={styles.detailText}>{p}</p>)}
          {product.detailImages.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- 임포트한 상세 이미지, 원본 비율 그대로 표시
            <img key={src} src={src} alt={i === 0 ? `${product.name} 상세 이미지` : ""} loading="lazy" className={styles.detailImage} />
          ))}
          {product.allergy && (
            <div className={styles.allergy}>
              <strong>알레르기 정보</strong>
              <p>{product.allergy}</p>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
