"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMe } from "@/features/auth/useMe";
import styles from "./MyPageShell.module.scss";

const MENU = [
  { href: "/subscriptions", label: "내 구독" },
  { href: "/orders", label: "주문 내역" },
  { href: "/account/payment-methods", label: "결제 수단" },
  { href: "/notifications", label: "알림" },
  { href: "/account", label: "내 정보", exact: true },
];

/** 마이페이지 공통 셸: 데스크톱은 왼쪽 메뉴 + 본문, 모바일은 본문만(하단 탭이 이동을 맡는다). */
export function MyPageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: me } = useMe();
  return (
    <div className={styles.shell}>
      <aside className={styles.aside} aria-label="마이페이지 메뉴">
        <div className={styles.profile}>
          <strong>{me ? `${me.name}님` : "마이페이지"}</strong>
          {me && <span>{me.email}</span>}
        </div>
        <nav className={styles.menu}>
          {MENU.map((m) => {
            const active = m.exact ? pathname === m.href : pathname.startsWith(m.href);
            return <Link key={m.href} href={m.href} aria-current={active ? "page" : undefined}>{m.label}</Link>;
          })}
          {me?.role === "ADMIN" && <Link href="/admin" className={styles.admin}>관리자 화면</Link>}
        </nav>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
