import type { Metadata } from "next";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = { title: "장바구니" };

export default function CartPage() {
  return <CartView />;
}
