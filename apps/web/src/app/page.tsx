import { Button } from "@/components/ui";
import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <section className={styles.hero}>
      <div className={styles.banner}>
        <h1>소비 주기에 맞춰 알아서 도착합니다</h1>
        <p>세제, 화장지, 생수, 커피. 떨어질 때쯤 자동으로 주문되고 결제되는 생필품 정기배송입니다. 첫 구독은 10% 할인.</p>
        <Button href="/products" className={styles.cta}>구독 상품 보기</Button>
      </div>
    </section>
  );
}
