import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, type Category, type Paginated, type ProductDto } from "@routinebox/shared";
import { Button, EmptyState } from "@/components/ui";
import { CategoryChips } from "@/features/product/CategoryChips";
import { Pagination } from "@/features/product/Pagination";
import { ProductGrid } from "@/features/product/ProductGrid";
import { SearchForm } from "@/features/product/SearchForm";
import { productQueryString } from "@/features/product/api";
import { serverApi } from "@/lib/server-api";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "상품" };

type Search = { category?: string; q?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const category = CATEGORIES.includes(sp.category as Category) ? (sp.category as Category) : undefined;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await serverApi<Paginated<ProductDto>>(`/products${productQueryString({ category, q, page, pageSize: 12 })}`);
  const title = q ? `‘${q}’ 검색 결과` : category ? CATEGORY_LABELS[category] : "전체 상품";

  return (
    <section className={styles.page}>
      <aside className={styles.aside} aria-label="카테고리 필터">
        <div className={styles.filterGroup}>
          <strong>카테고리</strong>
          <Link href="/products" aria-current={!category && !q ? "page" : undefined}>전체 상품</Link>
          {CATEGORIES.map((c) => <Link key={c} href={`/products?category=${c}`} aria-current={category === c ? "page" : undefined}>{CATEGORY_LABELS[c]}</Link>)}
        </div>
        <div className={styles.promo}>
          <strong>구독하면 5% 할인</strong>
          <span>주기·수량은 언제든 바꿀 수 있고, 배송비는 항상 무료예요.</span>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.top}>
          <div>
            <p className={styles.crumb}>홈 › {category ? CATEGORY_LABELS[category] : q ? "검색" : "전체 상품"}</p>
            <h1 className={styles.title}>{title} <span className={styles.count}>{data.total}개</span></h1>
          </div>
          <SearchForm initial={q} category={category} className={styles.search} />
        </div>
        <div className={styles.chips}><CategoryChips current={category} q={q} /></div>
        {data.items.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="찾는 상품이 없어요"
            description="다른 검색어를 입력하거나 카테고리를 바꿔 보세요."
            action={<Button href="/products" variant="secondary">전체 상품 보기</Button>}
          />
        ) : (
          <>
            <ProductGrid products={data.items} />
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => `/products${productQueryString({ category, q, page: p })}`} />
          </>
        )}
      </div>
    </section>
  );
}
