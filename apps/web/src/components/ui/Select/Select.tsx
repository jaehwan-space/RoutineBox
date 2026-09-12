import { ChevronDown } from "lucide-react";
import { useId, type ComponentPropsWithRef } from "react";
import { cx } from "@/lib/cx";
import styles from "./Select.module.scss";

export interface SelectProps extends Omit<ComponentPropsWithRef<"select">, "size"> {
  label?: string;
  helper?: string;
  error?: string;
  className?: string;
}

/** 네이티브 select 를 디자인 토큰에 맞춰 스타일링한 컴포넌트 */
export function Select({ label, helper, error, id, className, children, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const messageId = `${selectId}-message`;
  const message = error ?? helper;
  return (
    <div className={cx(styles.field, className)}>
      {label && <label htmlFor={selectId} className={styles.label}>{label}</label>}
      <div className={styles.control}>
        <select id={selectId} className={styles.select} aria-invalid={error ? true : undefined} aria-describedby={message ? messageId : undefined} {...rest}>
          {children}
        </select>
        <ChevronDown className={styles.chevron} aria-hidden />
      </div>
      {message && (
        <p id={messageId} className={error ? styles.error : styles.helper} role={error ? "alert" : undefined}>{message}</p>
      )}
    </div>
  );
}
