"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AlertTriangle, BarChart3, Package, Repeat, ShoppingBag } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { RequireAdmin } from "@/components/RequireAuth";
import styles from "./Admin.module.scss";

const TABS = [
  { href: "/admin", label: "대시보드", Icon: BarChart3 },
  { href: "/admin/orders", label: "주문·배송", Icon: Package },
  { href: "/admin/subscriptions", label: "구독", Icon: Repeat },
  { href: "/admin/payments", label: "결제 실패", Icon: AlertTriangle },
  { href: "/admin/products", label: "상품", Icon: ShoppingBag },
];

/** 관리자 셸: 데스크톱은 짙은 올리브 사이드바, 모바일은 가로 칩 메뉴. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCurrent = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <RequireAdmin>
      <div className={styles.shell}>
        <aside className={styles.side} aria-label="관리자 메뉴">
          <div className={styles.sideBrand}><LogoMark size={26} tone="mono" /><span>루틴박스 <small>관리자</small></span></div>
          <nav className={styles.sideNav}>
            {TABS.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined}><Icon aria-hidden />{label}</Link>)}
          </nav>
          <Link href="/" className={styles.sideBack}>← 쇼핑몰로</Link>
        </aside>
        <div className={styles.body}>
          <nav className={styles.nav} aria-label="관리자 메뉴">
            {TABS.map((t) => <Link key={t.href} href={t.href} aria-current={isCurrent(t.href) ? "page" : undefined}>{t.label}</Link>)}
          </nav>
          {children}
        </div>
      </div>
    </RequireAdmin>
  );
}
