import type { Prisma } from "@prisma/client";
import { fromDbDate, type OrderDetailDto, type OrderListItemDto, type OrderQuery, type Paginated, type PaymentDto } from "@routinebox/shared";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export const orderInclude = {
  subscription: { select: { id: true, cycleDays: true, product: { select: { id: true, name: true, category: true } }, paymentMethod: { select: { cardCompany: true, cardLast4: true } } } },
  payment: true,
} satisfies Prisma.OrderInclude;
export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export const toPaymentDto = (p: OrderRow["payment"]): PaymentDto | null =>
  p ? { status: p.status, amount: p.amount, paymentKey: p.paymentKey, approvedAt: p.approvedAt?.toISOString() ?? null, failReason: p.failReason } : null;

export function toOrderListItem(o: OrderRow): OrderListItemDto {
  return {
    id: o.id, orderKey: o.orderKey, amount: o.amount, quantity: o.quantity, status: o.status, deliveryStatus: o.deliveryStatus,
    billingDate: fromDbDate(o.billingDate), deliveryDate: fromDbDate(o.deliveryDate), createdAt: o.createdAt.toISOString(),
    subscriptionId: o.subscription.id, product: o.subscription.product, cycleDays: o.subscription.cycleDays,
  };
}

export function toOrderDetail(o: OrderRow): OrderDetailDto {
  return { ...toOrderListItem(o), payment: toPaymentDto(o.payment), paymentMethod: o.subscription.paymentMethod };
}

export async function listMine(userId: string, query: OrderQuery): Promise<Paginated<OrderListItemDto>> {
  const where: Prisma.OrderWhereInput = { userId };
  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, include: orderInclude, orderBy: [{ billingDate: "desc" }, { createdAt: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  return { items: rows.map(toOrderListItem), page: query.page, pageSize: query.pageSize, total };
}

export async function getMine(userId: string, id: string): Promise<OrderDetailDto> {
  const o = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!o) throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  return toOrderDetail(o);
}
