"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ProductDto } from "@routinebox/shared";
import { Button } from "@/components/ui";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { SubscribeDialog } from "./SubscribeDialog";
import { SubscribeInline } from "./SubscribeInline";
import styles from "./SubscribeDialog.module.scss";

/** 상품 상세의 구독 설정 진입점. 데스크톱은 인라인 패널, 그 외는 버튼 + 바텀시트. ?subscribe=1 이면 시트를 바로 연다(카드 등록 후 복귀용). */
export function SubscribeCta({ product }: { product: ProductDto }) {
  const params = useSearchParams();
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(params.get("subscribe") === "1");
  if (desktop) return <SubscribeInline product={product} />;
  return (
    <>
      <div className={styles.ctaRow}>
        <AddToCartButton product={product} size="lg" variant="secondary" />
        <Button size="lg" disabled={product.stock <= 0} onClick={() => setOpen(true)}>구독 설정하기</Button>
      </div>
      <SubscribeDialog product={product} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
