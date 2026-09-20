import Link from "next/link";
import { Bell, LayoutGrid, Repeat } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS } from "@routinebox/shared";
import { Logo } from "@/components/brand/Logo";
import { SearchForm } from "@/features/product/SearchForm";
import { cx } from "@/lib/cx";
import { HeaderCart } from "./HeaderCart";
import { HeaderUser } from "./HeaderUser";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.scss";

/**
 * 헤더: (데스크톱) 안내 바 → 로고 + 큰 검색창 + 아이콘 → 카테고리 내비 / (모바일) 로고 + 아이콘 → 검색창.
 * 하단 탭(모바일)은 BottomTabBar 가 맡는다.
 */
export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.utility}>
        <div className={styles.utilityInner}>
          <span>생활필수품 정기배송 · 구독 시 5% 할인 · 배송비 무료</span>
          <Link href="/#how">이용 방법</Link>
        </div>
      </div>
      <div className={styles.main}>
        <Logo tagline className={styles.logo} />
        <SearchForm compact className={styles.search} />
        <div className={styles.actions}>
          <span className={styles.desktopOnly}><ThemeToggle /></span>
          <Link href="/notifications" className={cx(styles.iconLink, styles.desktopOnly)} aria-label="알림"><Bell /></Link>
          <Link href="/subscriptions" className={cx(styles.iconLink, styles.desktopOnly)} aria-label="내 구독"><Repeat /></Link>
          <HeaderCart />
          <HeaderUser />
        </div>
      </div>
      <nav className={styles.catNav} aria-label="카테고리">
        <div className={styles.catInner}>
          <Link href="/products" className={styles.catAll}><LayoutGrid />전체 카테고리</Link>
          {CATEGORIES.map((c) => <Link key={c} href={`/products?category=${c}`}>{CATEGORY_LABELS[c]}</Link>)}
          <span className={styles.divider} aria-hidden="true" />
          <Link href="/subscriptions">내 구독</Link>
          <Link href="/orders">주문 내역</Link>
          <Link href="/#how" className={styles.catAccent}>첫 구독 혜택</Link>
        </div>
      </nav>
    </header>
  );
}
