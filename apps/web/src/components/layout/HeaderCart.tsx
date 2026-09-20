"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartLines } from "@/features/cart/useCart";
import styles from "./Header.module.scss";

export function HeaderCart() {
  const { itemCount } = useCartLines();
  return (
    <Link href="/cart" className={styles.iconLink} aria-label={itemCount > 0 ? `장바구니 ${itemCount}개` : "장바구니"}>
      <ShoppingCart />
      {itemCount > 0 && <span className={styles.badge} aria-hidden>{itemCount > 99 ? "99+" : itemCount}</span>}
    </Link>
  );
}
