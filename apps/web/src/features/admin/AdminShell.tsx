"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RequireAdmin } from "@/components/RequireAuth";
import styles from "./Admin.module.scss";

const TABS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "주문·배송" },
  { href: "/admin/subscriptions", label: "구독" },
  { href: "/admin/payments", label: "결제 실패" },
  { href: "/admin/products", label: "상품" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireAdmin>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="관리자 메뉴">
          {TABS.map((t) => {
            const current = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
            return <Link key={t.href} href={t.href} aria-current={current ? "page" : undefined}>{t.label}</Link>;
          })}
        </nav>
        {children}
      </div>
    </RequireAdmin>
  );
}
