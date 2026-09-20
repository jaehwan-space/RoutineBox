import type { ProductDto } from "@routinebox/shared";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.scss";

export function ProductGrid({ products }: { products: ProductDto[] }) {
  return (
    <ul className={styles.grid}>
      {products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
    </ul>
  );
}
