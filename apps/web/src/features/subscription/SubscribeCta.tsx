"use client";

import type { ProductDto } from "@routinebox/shared";
import { Button, useToast } from "@/components/ui";

/** 상품 상세의 구독 설정 진입점. 구독 설정 모달은 이 컴포넌트에 연결된다. */
export function SubscribeCta({ product }: { product: ProductDto }) {
  const toast = useToast();
  return (
    <Button size="lg" disabled={product.stock <= 0} onClick={() => toast.info("구독 설정 화면을 준비 중입니다.")}>
      구독 설정하기
    </Button>
  );
}
