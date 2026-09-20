import type { Metadata } from "next";
import { Suspense } from "react";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = { title: "장바구니" };

export default function CartPage() {
  // CartView 는 ?checkout=1 / ?subscribe=<id> 를 읽으므로(useSearchParams) Suspense 가 필요하다.
  return <Suspense><CartView /></Suspense>;
}
