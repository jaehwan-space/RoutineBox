import Link from "next/link";
import { cx } from "@/lib/cx";
import styles from "./Logo.module.scss";

/** 로고 C안 "잎과 주기": 갈색 점 7개가 도는 주기 위에 올리브 잎 하나. */
const DOTS = [[46.1, 19.9], [52, 34], [46.1, 48.1], [32, 54], [17.9, 48.1], [12, 34], [17.9, 19.9]] as const;
export const LOGO_LEAF = "M32 3c8.5 3.5 12 12.5 6.5 20-3.5 4.5-9.5 4-11.5-2.5-2-6.5 0-13.5 5-17.5z";

export function LogoMark({ size = 28, tone = "brand", className }: { size?: number; tone?: "brand" | "mono"; className?: string }) {
  const dot = tone === "brand" ? "var(--color-accent)" : "currentColor";
  const leaf = tone === "brand" ? "var(--color-primary)" : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      {DOTS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.4" fill={dot} />)}
      <path d={LOGO_LEAF} fill={leaf} />
      {tone === "brand" && <path d="M31.5 7.5c1.5 5 1.5 9 .5 14" stroke="var(--color-surface)" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

export function Logo({ href = "/", size = "md", tagline = false, className }: { href?: string; size?: "sm" | "md" | "lg"; tagline?: boolean; className?: string }) {
  const px = size === "lg" ? 40 : size === "sm" ? 24 : 30;
  return (
    <Link href={href} className={cx(styles.logo, styles[size], className)} aria-label="루틴박스 홈">
      <LogoMark size={px} />
      <span className={styles.text}>
        <span className={styles.word}>루틴박스</span>
        {tagline && <span className={styles.tagline}>생활필수품 정기배송</span>}
      </span>
    </Link>
  );
}
