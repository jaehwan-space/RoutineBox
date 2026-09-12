import { Button } from "@/components/ui";
import styles from "./Pagination.module.scss";

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (page: number) => string }) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  if (last <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="페이지">
      {page > 1 ? <Button href={hrefFor(page - 1)} variant="secondary" size="sm">이전</Button> : <Button variant="secondary" size="sm" disabled>이전</Button>}
      <span className={styles.status} aria-current="page">{page} / {last}</span>
      {page < last ? <Button href={hrefFor(page + 1)} variant="secondary" size="sm">다음</Button> : <Button variant="secondary" size="sm" disabled>다음</Button>}
    </nav>
  );
}
