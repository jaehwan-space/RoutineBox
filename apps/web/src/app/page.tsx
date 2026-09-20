import Link from "next/link";
import { CATEGORIES, CATEGORY_CYCLE_DAYS, CATEGORY_LABELS, type CategoryCountDto, type Paginated, type ProductDto } from "@routinebox/shared";
import { Button } from "@/components/ui";
import { CategoryIcon } from "@/features/product/CategoryIcon";
import { ProductGrid } from "@/features/product/ProductGrid";
import { serverApi } from "@/lib/server-api";
import styles from "./page.module.scss";

const cycleHint = (days: number) => (days % 7 === 0 ? `${days / 7}주 주기` : `${days}일 주기`);

/** 히어로에 보여줄 상품 사진: 검색어로 고르고, 없으면 인기 상품으로 채운다 */
const HERO_PICKS = ["곡물 샐러드", "계란", "브로콜리"];

export default async function HomePage() {
  const [popular, categories, ...picks] = await Promise.all([
    serverApi<Paginated<ProductDto>>("/products?pageSize=5"),
    serverApi<CategoryCountDto[]>("/products/categories"),
    ...HERO_PICKS.map((q) => serverApi<Paginated<ProductDto>>(`/products?q=${encodeURIComponent(q)}&pageSize=1`).then((r) => r.items[0] ?? null).catch(() => null)),
  ]);
  const shownCategories = (categories.length > 0 ? categories.map((c) => c.category) : CATEGORIES).slice(0, 12);
  const heroProducts = [...picks.filter((p): p is ProductDto => !!p?.imageUrl), ...popular.items.filter((p) => p.imageUrl)]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 3);
  return (
    <>
      <section className={styles.hero} aria-label="추천">
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>1인 가구를 위한 정기배송</span>
            <h1>떨어지기 전에,<br />알아서 도착해요</h1>
            <p>매일 먹는 식재료와 간편식부터 세제·화장지·생수·커피까지, 주기가 정해진 생활필수품을 내 주기에 맞춰 자동 결제·배송합니다. 언제든 건너뛰기·일시정지·해지할 수 있어요.</p>
            <div className={styles.heroActions}>
              <Button href="/products" size="lg" className={styles.ctaAccent}>첫 구독 시작하기</Button>
              <Button href="#how" size="lg" variant="secondary" className={styles.ctaGhost}>이용 방법 보기</Button>
            </div>
          </div>
          <div className={styles.heroArt}>
            {heroProducts.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className={[styles.artA, styles.artB, styles.artC][i]} aria-label={`${p.name} 상세 보기`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 임포트한 상품 사진 */}
                <img src={p.imageUrl ?? ""} alt="" />
                <span>{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.categories} aria-label="카테고리 바로가기">
        {shownCategories.map((c) => (
          <Link key={c} href={`/products?category=${c}`} className={styles.categoryLink}>
            <span className={styles.categoryIcon} style={{ background: `var(--tint-${c}, var(--color-primary-soft))` }}><CategoryIcon category={c} size={30} /></span>
            <strong>{CATEGORY_LABELS[c]}</strong>
            <small>{cycleHint(CATEGORY_CYCLE_DAYS[c])}</small>
          </Link>
        ))}
      </section>

      <section className={styles.section} aria-label="인기 구독 상품">
        <div className={styles.sectionHead}>
          <h2>지금 가장 많이 구독하는 상품</h2>
          <Link href="/products" className={styles.more}>전체 보기 →</Link>
        </div>
        <ProductGrid products={popular.items} columns={5} />
      </section>

      <section id="how" className={styles.section} aria-label="이용 방법">
        <div className={styles.how}>
          <h2>이렇게 이용해요</h2>
          <ol className={styles.steps}>
            <li><span className={styles.stepNo}>1</span><div><strong>상품과 주기를 고르기</strong><p>2·4·6·8주 또는 7~90일 사이 원하는 주기와 첫 배송일을 정해요.</p></div></li>
            <li><span className={styles.stepNo}>2</span><div><strong>카드 한 번만 등록</strong><p>배송 3일 전에 자동으로 결제되고, 하루 전 미리 알려드려요.</p></div></li>
            <li><span className={styles.stepNo}>3</span><div><strong>내 마음대로 조절</strong><p>이번 회차 건너뛰기, 일시정지, 주기 변경, 해지를 언제든 할 수 있어요.</p></div></li>
          </ol>
        </div>
      </section>

      <section className={styles.section} aria-label="첫 구독 혜택">
        <div className={styles.promo}>
          <div>
            <strong>첫 구독 혜택</strong>
            <p>모든 구독 상품 정가 대비 5% 할인 · 배송비 무료 · 결제 하루 전 알림</p>
          </div>
          <Button href="/products" className={styles.ctaAccent}>상품 둘러보기</Button>
        </div>
      </section>
    </>
  );
}
