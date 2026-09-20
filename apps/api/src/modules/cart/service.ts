import { subscriptionAmount, type CartCheckoutInput, type CartCheckoutResultDto, type CartDto, type CartItemInput } from "@routinebox/shared";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { toProductDto } from "../product/service.js";
import { assertFirstDeliveryDate, insertSubscription, ownPaymentMethod, toSubscriptionDto } from "../subscription/service.js";

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

/**
 * 장바구니 일괄 구독 시작: 담긴 상품마다 구독을 만들고 장바구니를 비운다.
 * 한 상품이라도 실패하면(품절 등) 아무것도 만들지 않는다. 결제수단이 없으면 모두 PENDING(카드 미등록)으로 만든다.
 */
export async function checkout(userId: string, input: CartCheckoutInput): Promise<CartCheckoutResultDto> {
  const rows = await prisma.cartItem.findMany({
    where: { userId, product: { isActive: true } },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) throw new AppError("VALIDATION_ERROR", "장바구니가 비어 있습니다.");
  const soldOut = rows.filter((r) => r.product.stock <= 0).map((r) => r.product.name);
  if (soldOut.length > 0) throw new AppError("CONFLICT", `일시 품절된 상품이 있습니다: ${soldOut.join(", ")}`, { soldOut });
  assertFirstDeliveryDate(input.firstDeliveryDate);
  const paymentMethod = input.paymentMethodId ? await ownPaymentMethod(userId, input.paymentMethodId) : null;
  const cycles = new Map(input.cycles.map((c) => [c.productId, c.cycleDays]));

  const created = await prisma.$transaction(async (tx) => {
    const subs = [];
    for (const r of rows) {
      subs.push(await insertSubscription(tx, userId, {
        product: r.product,
        quantity: r.quantity,
        cycleDays: cycles.get(r.productId) ?? r.product.recommendedCycleDays,
        firstDeliveryDate: input.firstDeliveryDate,
        paymentMethodId: paymentMethod?.id ?? null,
      }));
    }
    await tx.cartItem.deleteMany({ where: { userId, productId: { in: rows.map((r) => r.productId) } } });
    return subs;
  });
  return { subscriptions: created.map(toSubscriptionDto), cart: await getCart(userId) };
}
