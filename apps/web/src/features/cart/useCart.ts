"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { CartDto, ProductDto } from "@routinebox/shared";
import { useToast } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";
import { SUBS_KEY } from "@/features/subscription/useSubscriptions";
import { ApiError } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { cartApi } from "./api";

export const CART_KEY = ["cart"] as const;

export interface CartLineView {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  product?: ProductDto;
}

/** 서버 장바구니 줄(로그인 사용자): 상품 정보가 있어 장바구니에서 바로 구독을 만들 수 있다. */
export type CartLineWithProduct = CartLineView & { product: ProductDto };
export const hasProduct = (l: CartLineView): l is CartLineWithProduct => !!l.product;

/** 로그인 사용자는 서버 장바구니, 비로그인은 로컬 스토어를 같은 형태로 돌려준다. */
export function useCartLines() {
  const { data: me, isPending: mePending } = useMe();
  const local = useCartStore((s) => s.lines);
  const query = useQuery<CartDto>({ queryKey: CART_KEY, queryFn: cartApi.get, enabled: !!me });
  const lines: CartLineView[] = me
    ? (query.data?.items ?? []).map((i) => ({ productId: i.productId, name: i.product.name, unitPrice: i.product.subscriptionPrice, quantity: i.quantity, lineTotal: i.lineTotal, product: i.product }))
    : local.map((l) => ({ productId: l.productId, name: l.name, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.unitPrice * l.quantity }));
  return {
    lines,
    total: lines.reduce((n, l) => n + l.lineTotal, 0),
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    isGuest: !me,
    // 로그인 여부를 아직 모르면 로딩으로 본다(로그인 사용자에게 빈 게스트 장바구니가 잠깐 보이지 않도록).
    isLoading: mePending || (!!me && query.isPending),
  };
}

export function useCartActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useMe();
  const store = useCartStore();

  const put = useMutation({
    mutationFn: cartApi.put,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: CART_KEY });
      const prev = qc.getQueryData<CartDto>(CART_KEY);
      if (prev) {
        const items = prev.items.map((i) => (i.productId === input.productId ? { ...i, quantity: input.quantity, lineTotal: i.product.subscriptionPrice * input.quantity } : i));
        qc.setQueryData<CartDto>(CART_KEY, { items, itemCount: items.reduce((n, i) => n + i.quantity, 0), total: items.reduce((n, i) => n + i.lineTotal, 0) });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(CART_KEY, ctx.prev); toast.error("장바구니를 저장하지 못했어요. 다시 시도해 주세요."); },
    onSuccess: (data) => qc.setQueryData(CART_KEY, data),
  });
  const remove = useMutation({
    mutationFn: cartApi.remove,
    onSuccess: (data) => qc.setQueryData(CART_KEY, data),
    onError: () => toast.error("삭제하지 못했어요. 다시 시도해 주세요."),
  });

  return {
    add: async (product: ProductDto) => {
      if (!me) {
        store.add({ productId: product.id, name: product.name, unitPrice: product.subscriptionPrice });
      } else {
        const cart = await qc.ensureQueryData({ queryKey: CART_KEY, queryFn: cartApi.get });
        const current = cart.items.find((i) => i.productId === product.id)?.quantity ?? 0;
        await put.mutateAsync({ productId: product.id, quantity: Math.min(20, current + 1) });
      }
      toast.success(`${product.name}을(를) 장바구니에 담았어요.`);
    },
    setQuantity: (productId: string, quantity: number) => (me ? put.mutate({ productId, quantity }) : store.setQuantity(productId, quantity)),
    remove: (productId: string) => (me ? remove.mutate(productId) : store.remove(productId)),
    isBusy: put.isPending || remove.isPending,
  };
}

/** 장바구니 일괄 구독 시작. 성공하면 장바구니 캐시를 비우고 내 구독으로 이동한다. */
export function useCartCheckout() {
  const qc = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  return useMutation({
    mutationFn: cartApi.checkout,
    onSuccess: async (result) => {
      qc.setQueryData<CartDto>(CART_KEY, result.cart);
      await qc.invalidateQueries({ queryKey: SUBS_KEY });
      const n = result.subscriptions.length;
      const first = result.subscriptions[0];
      toast.success(
        first && result.subscriptions.every((s) => s.status === "ACTIVE")
          ? `구독 ${n}개를 시작했어요. 첫 결제일은 ${first.nextBillingDate} 입니다.`
          : `구독 ${n}개를 만들었어요. 카드를 등록하면 시작됩니다.`,
      );
      router.push("/subscriptions");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "구독을 시작하지 못했어요."),
  });
}

/** 로그인 직후: 로컬 장바구니를 서버로 옮기고 비운다. */
export async function mergeLocalCart(qc: QueryClient) {
  const { lines, clear } = useCartStore.getState();
  if (lines.length === 0) return;
  let last: CartDto | undefined;
  for (const line of lines) {
    try {
      last = await cartApi.put({ productId: line.productId, quantity: line.quantity });
    } catch {
      /* 판매 종료된 상품 등은 건너뛴다 */
    }
  }
  clear();
  if (last) qc.setQueryData(CART_KEY, last);
  else await qc.invalidateQueries({ queryKey: CART_KEY });
}
