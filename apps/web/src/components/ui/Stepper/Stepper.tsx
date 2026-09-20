"use client";

import { Minus, Plus } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cx } from "@/lib/cx";
import styles from "./Stepper.module.scss";

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "md";
  disabled?: boolean;
  /** 스크린리더용 이름 (예: "수량") */
  "aria-label": string;
  className?: string;
}

/** 수량 조절기. 화살표 키·Home·End 로도 조작할 수 있다. */
export function Stepper({ value, onChange, min = 1, max = 99, step = 1, size = "md", disabled, className, ...rest }: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const set = (n: number) => { if (!disabled) onChange(clamp(n)); };
  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    const map: Record<string, number | undefined> = { ArrowUp: value + step, ArrowRight: value + step, ArrowDown: value - step, ArrowLeft: value - step, Home: min, End: max };
    const next = map[e.key];
    if (next !== undefined) { e.preventDefault(); set(next); }
  };
  return (
    <div className={cx(styles.stepper, styles[size], disabled && styles.disabled, className)}>
      <button type="button" className={styles.control} onClick={() => set(value - step)} disabled={disabled || value <= min} aria-label="줄이기">
        <Minus aria-hidden />
      </button>
      <span
        className={styles.value}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={rest["aria-label"]}
        onKeyDown={onKeyDown}
      >
        {value}
      </span>
      <button type="button" className={styles.control} onClick={() => set(value + step)} disabled={disabled || value >= max} aria-label="늘리기">
        <Plus aria-hidden />
      </button>
    </div>
  );
}
