import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine { productId: string; name: string; price: number; quantity: number; }

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

/** 장바구니는 클라이언트 상태(로컬 저장). 서버 동기화는 3주차에 연결한다. */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((s) => {
          const found = s.lines.find((l) => l.productId === line.productId);
          if (found) return { lines: s.lines.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l)) };
          return { lines: [...s.lines, { ...line, quantity }] };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({ lines: s.lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)) })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "routinebox-cart" },
  ),
);
