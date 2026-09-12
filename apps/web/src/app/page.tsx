import { type Paginated, type ProductDto } from "@routinebox/shared";
import { Button } from "@/components/ui";
import { CategoryChips } from "@/features/product/CategoryChips";
import { ProductGrid } from "@/features/product/ProductGrid";
import { serverApi } from "@/lib/server-api";
import styles from "./page.module.scss";

export default async function HomePage() {
  const popular = await serverApi<Paginated<ProductDto>>("/products?pageSize=6");
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.banner}>
          <h1>소비 주기에 맞춰 알아서 도착합니다</h1>
          <p>세제, 화장지, 생수, 커피. 떨어질 때쯤 자동으로 주문되고 결제되는 생필품 정기배송입니다. 첫 구독은 10% 할인.</p>
          <Button href="/products" className={styles.cta}>구독 상품 보기</Button>
        </div>
      </section>
      <section className={styles.section}>
        <CategoryChips />
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>인기 구독 상품</h2>
          <Button href="/products" variant="ghost" size="sm">전체 보기</Button>
        </div>
        <ProductGrid products={popular.items} />
      </section>
      <section className={styles.section}>
        <ol className={styles.steps} aria-label="이용 방법">
          <li><span className={styles.stepNo}>1</span><div><strong>상품 고르기</strong><p>카테고리나 검색으로 생필품을 고릅니다.</p></div></li>
          <li><span className={styles.stepNo}>2</span><div><strong>주기·수량 정하기</strong><p>2·4·6·8주 또는 원하는 간격으로 설정합니다.</p></div></li>
          <li><span className={styles.stepNo}>3</span><div><strong>자동 결제·배송</strong><p>결제 하루 전 알림, 언제든 건너뛰기·해지.</p></div></li>
        </ol>
      </section>
    </>
  );
}
