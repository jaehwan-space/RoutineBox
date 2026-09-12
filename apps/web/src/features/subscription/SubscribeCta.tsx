"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ProductDto } from "@routinebox/shared";
import { Button } from "@/components/ui";
import { SubscribeDialog } from "./SubscribeDialog";

/** 상품 상세의 구독 설정 진입점. ?subscribe=1 이면 바로 연다(카드 등록 후 복귀용). */
export function SubscribeCta({ product }: { product: ProductDto }) {
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get("subscribe") === "1");
  return (
    <>
      <Button size="lg" disabled={product.stock <= 0} onClick={() => setOpen(true)}>구독 설정하기</Button>
      <SubscribeDialog product={product} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
