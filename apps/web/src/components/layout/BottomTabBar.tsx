"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Repeat, UserRound } from "lucide-react";
import { cx } from "@/lib/cx";
import styles from "./BottomTabBar.module.scss";

const TABS = [
  { href: "/", label: "홈", Icon: Home, match: (p: string) => p === "/" },
  { href: "/products", label: "카테고리", Icon: LayoutGrid, match: (p: string) => p.startsWith("/products") || p === "/cart" },
  { href: "/subscriptions", label: "내 구독", Icon: Repeat, match: (p: string) => p.startsWith("/subscriptions") },
  { href: "/account", label: "마이", Icon: UserRound, match: (p: string) => p.startsWith("/account") || p.startsWith("/orders") || p.startsWith("/notifications") },
];

/** 모바일 하단 탭. 데스크톱에서는 숨긴다. */
export function BottomTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/signup")) return null;
  return (
    <nav className={styles.bar} aria-label="하단 메뉴">
      {TABS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link key={href} href={href} className={cx(styles.tab, active && styles.active)} aria-current={active ? "page" : undefined}>
            <Icon aria-hidden />{label}
          </Link>
        );
      })}
    </nav>
  );
}
