import { CATEGORIES, CATEGORY_LABELS, type Category } from "@routinebox/shared";
import { Chip } from "@/components/ui";
import styles from "./CategoryChips.module.scss";

export function CategoryChips({ current, q }: { current?: Category; q?: string }) {
  const href = (category?: Category) => {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/products${s ? `?${s}` : ""}`;
  };
  return (
    <nav className={styles.chips} aria-label="카테고리">
      <Chip href={href()} selected={!current} size="sm">전체</Chip>
      {CATEGORIES.map((c) => (
        <Chip key={c} href={href(c)} selected={current === c} size="sm">{CATEGORY_LABELS[c]}</Chip>
      ))}
    </nav>
  );
}
