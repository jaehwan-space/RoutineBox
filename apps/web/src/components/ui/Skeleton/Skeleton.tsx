import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";
import styles from "./Skeleton.module.scss";

export interface SkeletonProps {
  variant?: "text" | "rect" | "circle";
  width?: number | string;
  height?: number | string;
  className?: string;
}

/** 로딩 자리표시자. 장식 요소이므로 스크린리더에서 숨긴다. */
export function Skeleton({ variant = "rect", width, height, className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  return <span className={cx(styles.skeleton, styles[variant], className)} style={style} aria-hidden />;
}
