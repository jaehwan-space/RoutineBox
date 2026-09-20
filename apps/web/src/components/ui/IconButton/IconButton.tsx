import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./IconButton.module.scss";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** 스크린리더용 이름 (필수) */
  "aria-label": string;
  size?: "sm" | "md";
  variant?: "ghost" | "outline";
  active?: boolean;
  children: ReactNode;
}

/** 아이콘만 있는 버튼. 항상 aria-label 을 받는다. */
export function IconButton({ size = "md", variant = "ghost", active, className, type = "button", children, ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx(styles.button, styles[size], styles[variant], active && styles.active, className)} aria-pressed={active} {...rest}>
      {children}
    </button>
  );
}
