"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { ProductDto } from "@routinebox/shared";
import { Button, type ButtonProps } from "@/components/ui";
import { useCartActions } from "./useCart";

export function AddToCartButton({ product, ...rest }: { product: ProductDto } & Partial<Pick<ButtonProps, "size" | "variant" | "fullWidth">>) {
  const { add } = useCartActions();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      leadingIcon={<ShoppingCart />}
      loading={busy}
      disabled={product.stock <= 0}
      onClick={async () => { setBusy(true); try { await add(product); } finally { setBusy(false); } }}
      {...rest}
    >
      담기
    </Button>
  );
}
