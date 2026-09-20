import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}
type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };
type AsLink = Common & { href: string; onClick?: MouseEventHandler<HTMLAnchorElement>; target?: string; rel?: string };
export type ButtonProps = AsButton | AsLink;

/** 기본 버튼. href 를 주면 같은 모양의 링크로 렌더링된다. */
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", loading = false, fullWidth, leadingIcon, trailingIcon, className, children, ...rest } = props;
  const cls = cx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, loading && styles.loading, className);
  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden />}
      {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
      <span className={styles.label}>{children}</span>
      {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
    </>
  );
  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkRest } = rest as AsLink;
    return (
      <Link href={href} className={cls} aria-disabled={loading || undefined} {...linkRest}>
        {content}
      </Link>
    );
  }
  const { type = "button", disabled, ...buttonRest } = rest as AsButton;
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonRest}>
      {content}
    </button>
  );
}
