import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Card.module.scss";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  padding?: "none" | "sm" | "md" | "lg";
  /** 클릭·호버 가능한 카드(상품 카드 등) */
  interactive?: boolean;
  children: ReactNode;
}

/** 테두리로 구분되는 표면. 그림자를 쓰지 않는다(떠 있는 요소는 Dialog·Toast 뿐). */
export function Card({ as: Tag = "div", padding = "md", interactive, className, children, ...rest }: CardProps) {
  return (
    <Tag className={cx(styles.card, styles[`pad-${padding}`], interactive && styles.interactive, className)} {...rest}>
      {children}
    </Tag>
  );
}
