import { subscriptionAmount, type CartDto, type CartItemInput } from "@routinebox/shared";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { toProductDto } from "../product/service.js";

export async function getCart(userId: string): Promise<CartDto> {
  const rows = await prisma.cartItem.findMany({
    where: { userId, product: { isActive: true } },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });
  const items = rows.map((r) => ({
    productId: r.productId,
    quantity: r.quantity,
    product: toProductDto(r.product),
    lineTotal: subscriptionAmount(r.product.price, r.product.subscriptionDiscount, r.quantity),
  }));
  return { items, itemCount: items.reduce((n, i) => n + i.quantity, 0), total: items.reduce((n, i) => n + i.lineTotal, 0) };
}

/** 담기·수량 변경(upsert). 비활성 상품은 404. */
export async function putItem(userId: string, input: CartItemInput): Promise<CartDto> {
  const product = await prisma.product.findFirst({ where: { id: input.productId, isActive: true } });
  if (!product) throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId: input.productId } },
    update: { quantity: input.quantity },
    create: { userId, productId: input.productId, quantity: input.quantity },
  });
  return getCart(userId);
}

export async function removeItem(userId: string, productId: string): Promise<CartDto> {
  await prisma.cartItem.deleteMany({ where: { userId, productId } });
  return getCart(userId);
}
