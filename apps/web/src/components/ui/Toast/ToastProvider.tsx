"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Toast.module.scss";

export type ToastKind = "success" | "error" | "info";
export interface ToastOptions { kind?: ToastKind; message: string; durationMs?: number }
interface ToastItem extends Required<Omit<ToastOptions, "durationMs">> { id: number }

interface ToastApi {
  toast: (opts: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const remove = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback((opts: ToastOptions) => {
    const id = ++seq.current;
    setItems((list) => [...list.slice(-3), { id, kind: opts.kind ?? "info", message: opts.message }]);
    window.setTimeout(() => remove(id), opts.durationMs ?? (opts.kind === "error" ? 5000 : 3500));
  }, [remove]);
  const api = useMemo<ToastApi>(() => ({
    toast,
    success: (message) => toast({ kind: "success", message }),
    error: (message) => toast({ kind: "error", message }),
    info: (message) => toast({ kind: "info", message }),
  }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region}>
        {items.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div key={t.id} className={cx(styles.toast, styles[t.kind])} role={t.kind === "error" ? "alert" : "status"} aria-live={t.kind === "error" ? "assertive" : "polite"}>
              <Icon className={styles.icon} aria-hidden />
              <span className={styles.message}>{t.message}</span>
              <button type="button" className={styles.close} onClick={() => remove(t.id)} aria-label="알림 닫기"><X aria-hidden /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast 는 ToastProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
