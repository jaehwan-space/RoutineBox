import Link from "next/link";
import { Bell, Box } from "lucide-react";
import { HeaderCart } from "./HeaderCart";
import { HeaderUser } from "./HeaderUser";
import { ThemeToggle } from "./ThemeToggle";
import { SearchForm } from "@/features/product/SearchForm";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="루틴박스 홈">
          <Box size={24} strokeWidth={2.2} />
          루틴박스
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/">홈</Link>
          <Link href="/products">카테고리</Link>
          <Link href="/subscriptions">내 구독</Link>
        </nav>
        <div className={styles.spacer} />
        <SearchForm compact className={styles.search} />
        <div className={styles.actions}>
          <ThemeToggle />
          <Link href="/notifications" className={`${styles.iconLink} ${styles.desktopOnly}`} aria-label="알림"><Bell /></Link>
          <HeaderCart />
          <HeaderUser />
        </div>
      </div>
    </header>
  );
}
