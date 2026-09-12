import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Input.module.scss";

export interface InputProps extends Omit<ComponentPropsWithRef<"input">, "size"> {
  label?: string;
  helper?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 필드 전체(라벨 포함) 클래스 */
  className?: string;
}

/** 라벨·도움말·오류 메시지를 포함한 텍스트 입력. react-hook-form 의 register() 를 그대로 펼쳐 쓸 수 있다. */
export function Input({ label, helper, error, leading, trailing, id, className, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? helper;
  return (
    <div className={cx(styles.field, className)}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <div className={cx(styles.control, leading ? styles.hasLeading : undefined, trailing ? styles.hasTrailing : undefined)}>
        {leading && <span className={styles.leading} aria-hidden>{leading}</span>}
        <input
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
        {trailing && <span className={styles.trailing}>{trailing}</span>}
      </div>
      {message && (
        <p id={messageId} className={error ? styles.error : styles.helper} role={error ? "alert" : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}
