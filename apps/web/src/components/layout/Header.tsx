import Link from "next/link";
import { Bell, Box, ShoppingCart } from "lucide-react";
import { HeaderUser } from "./HeaderUser";
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
        <div className={styles.actions}>
          <Bell size={20} aria-hidden />
          <Link href="/cart" aria-label="장바구니"><ShoppingCart size={20} /></Link>
          <HeaderUser />
        </div>
      </div>
    </header>
  );
}
