"use client";

import type { ProductDto } from "@routinebox/shared";
import { Button, Dialog } from "@/components/ui";
import { SubscribeFields } from "./SubscribeFields";
import { useSubscribeForm, type SubscribeFormOptions } from "./useSubscribeForm";

type Props = { product: ProductDto; open: boolean; onClose: () => void } & Pick<SubscribeFormOptions, "initialQuantity" | "returnTo" | "onCreated">;

/** 모바일·태블릿 상품 상세와 장바구니(개별 구독): 바텀시트로 여는 구독 설정 */
export function SubscribeDialog({ product, open, onClose, initialQuantity, returnTo, onCreated }: Props) {
  const form = useSubscribeForm(product, { onDone: onClose, initialQuantity, returnTo, onCreated });
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="구독 설정"
      description={product.name}
      footer={<><Button variant="ghost" onClick={onClose}>취소</Button><Button onClick={form.submit} loading={form.submitting}>{form.me ? "구독 시작하기" : "로그인하고 구독하기"}</Button></>}
    >
      <SubscribeFields product={product} form={form} />
    </Dialog>
  );
}
