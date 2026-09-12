import { AlertCircle, CheckCircle2, Circle, CreditCard, PauseCircle, Sparkles, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Badge.module.scss";

export type BadgeStatus = "active" | "paused" | "failed" | "pending" | "cancelled" | "neutral" | "accent";

const META: Record<BadgeStatus, { label: string; Icon: LucideIcon }> = {
  active: { label: "진행 중", Icon: CheckCircle2 },
  paused: { label: "일시정지", Icon: PauseCircle },
  failed: { label: "결제 실패", Icon: AlertCircle },
  pending: { label: "카드 미등록", Icon: CreditCard },
  cancelled: { label: "해지", Icon: XCircle },
  neutral: { label: "", Icon: Circle },
  accent: { label: "", Icon: Sparkles },
};

export interface BadgeProps {
  status?: BadgeStatus;
  /** 기본 라벨 대신 표시할 내용 */
  children?: ReactNode;
  /** 아이콘 표시 여부(상태 배지는 색상 단독 의존을 피하기 위해 기본 표시) */
  icon?: boolean;
  className?: string;
}

/** 상태 배지. 색과 함께 아이콘·텍스트로 상태를 전달한다. */
export function Badge({ status = "neutral", children, icon = true, className }: BadgeProps) {
  const { label, Icon } = META[status];
  return (
    <span className={cx(styles.badge, styles[status], className)}>
      {icon && status !== "neutral" && <Icon className={styles.icon} aria-hidden />}
      {children ?? label}
    </span>
  );
}
