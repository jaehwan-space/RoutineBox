import type { Metadata } from "next";
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
      <div className={styles.top}>
        <h1 className={styles.title}>{title} <span className={styles.count}>{data.total}개</span></h1>
        <SearchForm initial={q} category={category} className={styles.search} />
      </div>
      <CategoryChips current={category} q={q} />
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
    </section>
  );
}
