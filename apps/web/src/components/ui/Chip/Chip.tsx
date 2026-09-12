import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Chip.module.scss";

interface Common {
  selected?: boolean;
  size?: "sm" | "md";
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}
type AsLink = Common & { href: string; onClick?: undefined; disabled?: undefined };
type AsButton = Common & { href?: undefined; onClick?: () => void; disabled?: boolean };
export type ChipProps = AsLink | AsButton;

/** 선택형 칩. href 가 있으면 링크(aria-current), 없으면 토글 버튼(aria-pressed). */
export function Chip({ selected = false, size = "md", icon, className, children, ...rest }: ChipProps) {
  const cls = cx(styles.chip, styles[size], selected && styles.selected, className);
  const content = (
    <>
      {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      {children}
    </>
  );
  if (rest.href) {
    return <Link href={rest.href} className={cls} aria-current={selected ? "page" : undefined}>{content}</Link>;
  }
  return (
    <button type="button" className={cls} aria-pressed={selected} onClick={rest.onClick} disabled={rest.disabled}>
      {content}
    </button>
  );
}
