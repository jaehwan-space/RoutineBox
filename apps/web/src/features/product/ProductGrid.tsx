import type { ProductDto } from "@routinebox/shared";
import { cx } from "@/lib/cx";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.scss";

export function ProductGrid({ products, columns = 4 }: { products: ProductDto[]; columns?: 4 | 5 }) {
  return (
    <ul className={cx(styles.grid, columns === 5 && styles.five)}>
      {products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
    </ul>
  );
}
