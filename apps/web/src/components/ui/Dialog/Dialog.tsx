"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { IconButton } from "../IconButton";
import styles from "./Dialog.module.scss";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
  children: ReactNode;
}

/** 모바일에서는 바텀시트, 태블릿 이상에서는 중앙 모달. 네이티브 <dialog> 로 포커스 트랩·ESC 를 처리한다. */
export function Dialog({ open, onClose, title, description, size = "md", footer, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const onBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[size])}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={onBackdropClick}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {description && <p id={descId} className={styles.description}>{description}</p>}
          </div>
          <IconButton aria-label="닫기" size="sm" onClick={onClose}><X /></IconButton>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
}
