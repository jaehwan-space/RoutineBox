import type { Prisma } from "@prisma/client";
import {
  addDays, fromDbDate, kstDateTime, sameMonth, toDbDate, todayKst,
  type AdminDashboardDto, type AdminFailedPaymentDto, type AdminOrderDto, type AdminOrderQuery, type AdminSubscriptionDto,
  type AdminSubscriptionQuery, type Paginated, type UpdateDeliveryStatusInput,
} from "@routinebox/shared";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import * as notifications from "../notification/service.js";
import { orderInclude, toOrderListItem, toPaymentDto } from "../order/service.js";
import { subscriptionInclude, toSubscriptionDto } from "../subscription/service.js";

const userSelect = { select: { id: true, email: true, name: true } } as const;
const adminOrderInclude = { ...orderInclude, user: userSelect } satisfies Prisma.OrderInclude;
type AdminOrderRow = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;
const toAdminOrder = (o: AdminOrderRow): AdminOrderDto => ({ ...toOrderListItem(o), user: o.user, payment: toPaymentDto(o.payment) });

export async function dashboard(now: Date = new Date()): Promise<AdminDashboardDto> {
  const today = todayKst(now);
  const todayDb = toDbDate(today);
  const monthStart = toDbDate(`${today.slice(0, 7)}-01`);
  const from = toDbDate(addDays(today, -13));
  const [activeSubscriptions, pausedSubscriptions, failedSubscriptions, todayDueActive, todayDueRetry, todayPaid, todayFailed, monthly, preparingOrders, users, recent] = await Promise.all([
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "PAUSED" } }),
    prisma.subscription.count({ where: { status: "PAYMENT_FAILED" } }),
    prisma.subscription.count({ where: { status: "ACTIVE", nextBillingDate: { lte: todayDb } } }),
    prisma.subscription.count({ where: { status: "PAYMENT_FAILED", nextRetryAt: { lte: kstDateTime(today, 23, 59) } } }),
    prisma.order.count({ where: { status: "PAID", billingDate: todayDb } }),
    prisma.order.count({ where: { status: "FAILED", billingDate: todayDb } }),
    prisma.order.aggregate({ where: { status: "PAID", billingDate: { gte: monthStart } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.order.count({ where: { status: "PAID", deliveryStatus: "PREPARING" } }),
    prisma.user.count(),
    prisma.order.groupBy({ by: ["billingDate", "status"], where: { billingDate: { gte: from, lte: todayDb }, status: { in: ["PAID", "FAILED"] } }, _count: { _all: true }, _sum: { amount: true } }),
  ]);
  const last14Days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((date) => {
    const rows = recent.filter((r) => fromDbDate(r.billingDate) === date);
    const paidRow = rows.find((r) => r.status === "PAID");
    const failedRow = rows.find((r) => r.status === "FAILED");
    return { date, paid: paidRow?._count._all ?? 0, failed: failedRow?._count._all ?? 0, amount: paidRow?._sum.amount ?? 0 };
  });
  return {
    activeSubscriptions, pausedSubscriptions, failedSubscriptions,
    todayDue: todayDueActive + todayDueRetry, todayPaid, todayFailed,
    monthlyRevenue: monthly._sum.amount ?? 0, monthlyOrders: monthly._count._all,
    preparingOrders, users, last14Days,
  };
}

export async function listOrders(query: AdminOrderQuery): Promise<Paginated<AdminOrderDto>> {
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.deliveryStatus ? { deliveryStatus: query.deliveryStatus } : {}),
    ...(query.q ? { OR: [
      { user: { email: { contains: query.q, mode: "insensitive" } } },
      { user: { name: { contains: query.q, mode: "insensitive" } } },
      { subscription: { product: { name: { contains: query.q, mode: "insensitive" } } } },
      { orderKey: { contains: query.q } },
    ] } : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, include: adminOrderInclude, orderBy: [{ billingDate: "desc" }, { createdAt: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  return { items: rows.map(toAdminOrder), page: query.page, pageSize: query.pageSize, total };
}

/** 배송 상태 변경. 배송 중으로 바뀌면 배송 출발 알림(회차당 1회)을 보낸다. */
export async function updateDelivery(id: string, input: UpdateDeliveryStatusInput): Promise<AdminOrderDto> {
  const order = await prisma.order.findUnique({ where: { id }, include: adminOrderInclude });
  if (!order) throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  if (order.status !== "PAID") throw new AppError("CONFLICT", "결제가 완료된 주문만 배송 상태를 바꿀 수 있습니다.");
  const updated = await prisma.order.update({ where: { id }, data: { deliveryStatus: input.deliveryStatus }, include: adminOrderInclude });
  if (input.deliveryStatus === "SHIPPED" && order.deliveryStatus !== "SHIPPED") {
    const fresh = await notifications.record({ userId: order.userId, subscriptionId: order.subscriptionId, type: "SHIPPED", periodKey: order.orderKey });
    if (fresh) await notifications.notifyByMail("SHIPPED", { user: order.user, productName: order.subscription.product.name, quantity: order.quantity, deliveryDate: fromDbDate(order.deliveryDate) });
  }
  return toAdminOrder(updated);
}

const adminSubInclude = { ...subscriptionInclude, user: userSelect } satisfies Prisma.SubscriptionInclude;
type AdminSubRow = Prisma.SubscriptionGetPayload<{ include: typeof adminSubInclude }>;

export async function listSubscriptions(query: AdminSubscriptionQuery): Promise<Paginated<AdminSubscriptionDto>> {
  const where: Prisma.SubscriptionWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q ? { OR: [
      { user: { email: { contains: query.q, mode: "insensitive" } } },
      { user: { name: { contains: query.q, mode: "insensitive" } } },
      { product: { name: { contains: query.q, mode: "insensitive" } } },
    ] } : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({ where, include: adminSubInclude, orderBy: [{ createdAt: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  const items = rows.map((s: AdminSubRow): AdminSubscriptionDto => ({ ...toSubscriptionDto(s), user: s.user, nextRetryAt: s.nextRetryAt?.toISOString() ?? null, cancelledReason: s.cancelledReason }));
  return { items, page: query.page, pageSize: query.pageSize, total };
}

export async function failedPayments(): Promise<AdminFailedPaymentDto[]> {
  const rows = await prisma.subscription.findMany({
    where: { status: "PAYMENT_FAILED" },
    include: { user: userSelect, product: { select: { id: true, name: true } }, orders: { where: { status: "FAILED" }, orderBy: { updatedAt: "desc" }, take: 1, include: { payment: true } } },
    orderBy: [{ nextRetryAt: "asc" }],
  });
  return rows.map((s) => ({
    subscriptionId: s.id, user: s.user, product: s.product, amount: s.amount, failCount: s.failCount,
    nextRetryAt: s.nextRetryAt?.toISOString() ?? null,
    lastFailReason: s.orders[0]?.payment?.failReason ?? null,
    lastFailedAt: s.orders[0]?.updatedAt.toISOString() ?? null,
  }));
}

export const isThisMonth = (ymd: string, now: Date = new Date()) => sameMonth(ymd, todayKst(now));
