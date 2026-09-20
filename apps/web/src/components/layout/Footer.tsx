import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import styles from "./Footer.module.scss";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo size="sm" />
          <p>생활필수품을 내 주기에 맞춰 자동으로 받아보는 정기배송 구독 서비스</p>
        </div>
        <nav className={styles.links} aria-label="바로가기">
          <Link href="/products">상품</Link>
          <Link href="/subscriptions">내 구독</Link>
          <Link href="/orders">주문 내역</Link>
          <Link href="/#how">이용 방법</Link>
        </nav>
        <p className={styles.note}>2026-2학기 컴퓨터공학과 예비캡스톤디자인 졸업작품 · 결제는 토스페이먼츠 테스트 환경으로 실제 청구되지 않습니다.</p>
      </div>
    </footer>
  );
}
