"use client";

import { Bell, CreditCard, PackageSearch, Repeat, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";
import styles from "./Account.module.scss";

const LINKS = [
  { href: "/subscriptions", label: "내 구독", desc: "건너뛰기·일시정지·주기 변경·해지", Icon: Repeat },
  { href: "/orders", label: "주문 내역", desc: "회차별 결제 결과와 배송 상태", Icon: PackageSearch },
  { href: "/account/payment-methods", label: "결제 수단", desc: "카드 등록·삭제", Icon: CreditCard },
  { href: "/notifications", label: "알림", desc: "결제 예정·완료·배송 소식", Icon: Bell },
];

export function AccountView() {
  const { data: me } = useMe();
  if (!me) return null;
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{me.name}님</h1>
      <Card>
        <dl className={styles.rows}>
          <div><dt>이메일</dt><dd>{me.email}</dd></div>
          <div><dt>로그인 방식</dt><dd>{me.providers.length ? me.providers.map((p) => (p === "KAKAO" ? "카카오" : "구글")).join(", ") : "이메일"}</dd></div>
          <div><dt>가입일</dt><dd>{new Date(me.createdAt).toLocaleDateString("ko-KR")}</dd></div>
        </dl>
      </Card>
      <ul className={styles.links}>
        {LINKS.map(({ href, label, desc, Icon }) => (
          <li key={href}><Link href={href} className={styles.link}><Icon aria-hidden /><span><strong>{label}</strong><small>{desc}</small></span></Link></li>
        ))}
        {me.role === "ADMIN" && <li><Link href="/admin" className={styles.link}><ShieldCheck aria-hidden /><span><strong>관리자</strong><small>대시보드·상품·주문·구독 관리</small></span></Link></li>}
      </ul>
    </section>
  );
}
