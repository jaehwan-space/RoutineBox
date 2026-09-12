import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 비로그인 장바구니 줄. 로그인하면 서버로 병합된다. */
export interface LocalCartLine { productId: string; name: string; unitPrice: number; quantity: number }

interface CartState {
  lines: LocalCartLine[];
  add: (line: Omit<LocalCartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((s) => {
          const found = s.lines.find((l) => l.productId === line.productId);
          if (found) return { lines: s.lines.map((l) => (l.productId === line.productId ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l)) };
          return { lines: [...s.lines, { ...line, quantity }] };
        }),
      setQuantity: (productId, quantity) => set((s) => ({ lines: s.lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)) })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "routinebox-cart" },
  ),
);
