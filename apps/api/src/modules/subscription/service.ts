import type { Prisma, Product } from "@prisma/client";
import {
  addDays, billingDateFor, deliveryDateFor, fromDbDate, sameMonth, subscriptionAmount, toDbDate, todayKst,
  BILLING_LEAD_DAYS, type ActivateSubscriptionInput, type CreateSubscriptionInput, type ResumeSubscriptionInput,
  type SubscriptionDto, type SubscriptionListDto, type UpdateSubscriptionInput,
} from "@routinebox/shared";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { transition, type SubEvent, type SubPatch } from "./state-machine.js";

export const subscriptionInclude = {
  product: { select: { id: true, name: true, category: true, imageUrl: true } },
  paymentMethod: { select: { id: true, cardCompany: true, cardLast4: true, createdAt: true, deletedAt: true } },
} satisfies Prisma.SubscriptionInclude;
const include = subscriptionInclude;
type SubRow = Prisma.SubscriptionGetPayload<{ include: typeof include }>;
type SubRowWithOrders = Prisma.SubscriptionGetPayload<{ include: typeof include & { orders: true } }>;

export function toSubscriptionDto(s: SubRow | SubRowWithOrders): SubscriptionDto {
  return toDto(s);
}

function toDto(s: SubRow | SubRowWithOrders): SubscriptionDto {
  const next = s.nextBillingDate ? fromDbDate(s.nextBillingDate) : null;
  return {
    id: s.id,
    status: s.status,
    product: s.product,
    quantity: s.quantity,
    cycleDays: s.cycleDays,
    amount: s.amount,
    firstDeliveryDate: fromDbDate(s.firstDeliveryDate),
    nextBillingDate: next,
    nextDeliveryDate: next ? deliveryDateFor(next) : null,
    failCount: s.failCount,
    paymentMethod: s.paymentMethod && !s.paymentMethod.deletedAt
      ? { id: s.paymentMethod.id, cardCompany: s.paymentMethod.cardCompany, cardLast4: s.paymentMethod.cardLast4, createdAt: s.paymentMethod.createdAt.toISOString() }
      : null,
    createdAt: s.createdAt.toISOString(),
    ...("orders" in s
      ? { orders: s.orders.map((o) => ({ id: o.id, orderKey: o.orderKey, amount: o.amount, quantity: o.quantity, status: o.status, deliveryStatus: o.deliveryStatus, billingDate: fromDbDate(o.billingDate), deliveryDate: fromDbDate(o.deliveryDate), createdAt: o.createdAt.toISOString() })) }
      : {}),
  };
}

export async function ownPaymentMethod(userId: string, paymentMethodId: string) {
  const pm = await prisma.paymentMethod.findFirst({ where: { id: paymentMethodId, userId, deletedAt: null } });
  if (!pm) throw new AppError("NOT_FOUND", "결제 수단을 찾을 수 없습니다.");
  return pm;
}

/** 첫 배송일은 오늘 + 결제 리드타임 이후여야 한다(결제일이 오늘 이전이 되지 않도록). */
export function assertFirstDeliveryDate(firstDeliveryDate: string) {
  const earliest = addDays(todayKst(), BILLING_LEAD_DAYS);
  if (firstDeliveryDate < earliest) {
    throw new AppError("VALIDATION_ERROR", `첫 배송일은 ${earliest} 이후여야 합니다.`, { firstDeliveryDate: [`${earliest} 이후`] });
  }
}

export interface NewSubscription {
  product: Pick<Product, "id" | "price" | "subscriptionDiscount">;
  quantity: number;
  cycleDays: number;
  firstDeliveryDate: string;
  /** 소유 확인이 끝난 결제수단 id. 없으면 PENDING 으로 만든다. */
  paymentMethodId: string | null;
}

/** 트랜잭션 안에서 구독 한 건을 만들고, 결제수단이 있으면 '구독 시작' 알림 이력을 남긴다. 단건 생성과 장바구니 일괄 시작이 같이 쓴다. */
export async function insertSubscription(tx: Prisma.TransactionClient, userId: string, input: NewSubscription): Promise<SubRow> {
  const firstBilling = billingDateFor(input.firstDeliveryDate);
  const s = await tx.subscription.create({
    data: {
      userId,
      productId: input.product.id,
      quantity: input.quantity,
      cycleDays: input.cycleDays,
      amount: subscriptionAmount(input.product.price, input.product.subscriptionDiscount, input.quantity),
      firstDeliveryDate: toDbDate(input.firstDeliveryDate),
      nextBillingDate: toDbDate(firstBilling),
      status: input.paymentMethodId ? "ACTIVE" : "PENDING",
      paymentMethodId: input.paymentMethodId,
    },
    include,
  });
  if (input.paymentMethodId) await tx.notification.create({ data: { userId, subscriptionId: s.id, type: "SUBSCRIPTION_STARTED", periodKey: firstBilling } });
  return s;
}

async function ownSubscription(userId: string, id: string): Promise<SubRow> {
  const s = await prisma.subscription.findFirst({ where: { id, userId }, include });
  if (!s) throw new AppError("NOT_FOUND", "구독을 찾을 수 없습니다.");
  return s;
}

export async function listMine(userId: string): Promise<SubscriptionListDto> {
  const rows = await prisma.subscription.findMany({ where: { userId }, include, orderBy: [{ createdAt: "desc" }] });
  const today = todayKst();
  const items = rows.map(toDto);
  const monthlyDue = items.filter((s) => s.status === "ACTIVE" && s.nextBillingDate && sameMonth(s.nextBillingDate, today)).reduce((n, s) => n + s.amount, 0);
  return { items, monthlyDue, activeCount: items.filter((s) => s.status === "ACTIVE").length };
}

export async function getMine(userId: string, id: string): Promise<SubscriptionDto> {
  const s = await prisma.subscription.findFirst({ where: { id, userId }, include: { ...include, orders: { orderBy: { billingDate: "desc" } } } });
  if (!s) throw new AppError("NOT_FOUND", "구독을 찾을 수 없습니다.");
  return toDto(s);
}

export async function create(userId: string, input: CreateSubscriptionInput): Promise<SubscriptionDto> {
  const product = await prisma.product.findFirst({ where: { id: input.productId, isActive: true } });
  if (!product) throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  if (product.stock <= 0) throw new AppError("CONFLICT", "일시 품절된 상품입니다.");
  assertFirstDeliveryDate(input.firstDeliveryDate);
  const paymentMethod = input.paymentMethodId ? await ownPaymentMethod(userId, input.paymentMethodId) : null;
  const created = await prisma.$transaction((tx) =>
    insertSubscription(tx, userId, { product, quantity: input.quantity, cycleDays: input.cycleDays, firstDeliveryDate: input.firstDeliveryDate, paymentMethodId: paymentMethod?.id ?? null }),
  );
  return toDto(created);
}

/** 상태 머신 결과를 저장하고 필요한 알림 이력을 남긴다. */
async function apply(userId: string, id: string, build: (s: SubRow) => Promise<SubEvent> | SubEvent): Promise<SubscriptionDto> {
  const s = await ownSubscription(userId, id);
  const event = await build(s);
  const patch: SubPatch = transition(
    { status: s.status, cycleDays: s.cycleDays, quantity: s.quantity, amount: s.amount, nextBillingDate: s.nextBillingDate ? fromDbDate(s.nextBillingDate) : null, failCount: s.failCount, paymentMethodId: s.paymentMethodId },
    event,
  );
  const { nextBillingDate, ...rest } = patch;
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.subscription.update({
      where: { id: s.id },
      data: { ...rest, ...(nextBillingDate !== undefined ? { nextBillingDate: nextBillingDate ? toDbDate(nextBillingDate) : null } : {}) },
      include,
    });
    const noteType = event.type === "SKIP" ? "SKIPPED" : event.type === "CANCEL" ? "CANCELLED" : event.type === "ACTIVATE" ? "SUBSCRIPTION_STARTED" : null;
    if (noteType) {
      const periodKey = `${event.type}:${u.nextBillingDate ? fromDbDate(u.nextBillingDate) : "-"}:${Date.now()}`;
      await tx.notification.create({ data: { userId, subscriptionId: s.id, type: noteType, periodKey } });
    }
    return u;
  });
  return toDto(updated);
}

export const skip = (userId: string, id: string) => apply(userId, id, () => ({ type: "SKIP" }));
export const pause = (userId: string, id: string) => apply(userId, id, () => ({ type: "PAUSE" }));
export const cancel = (userId: string, id: string) => apply(userId, id, () => ({ type: "CANCEL" }));

export const resume = (userId: string, id: string, input: ResumeSubscriptionInput) =>
  apply(userId, id, () => {
    const earliest = addDays(todayKst(), 1);
    const next = input.nextBillingDate ?? addDays(todayKst(), BILLING_LEAD_DAYS);
    if (next < earliest) throw new AppError("VALIDATION_ERROR", `다음 결제일은 ${earliest} 이후여야 합니다.`);
    return { type: "RESUME", nextBillingDate: next };
  });

export const activate = (userId: string, id: string, input: ActivateSubscriptionInput) =>
  apply(userId, id, async (s) => {
    const pm = await ownPaymentMethod(userId, input.paymentMethodId);
    const stored = s.nextBillingDate ? fromDbDate(s.nextBillingDate) : billingDateFor(fromDbDate(s.firstDeliveryDate));
    const today = todayKst();
    return { type: "ACTIVATE", paymentMethodId: pm.id, nextBillingDate: stored < today ? today : stored };
  });

export const update = (userId: string, id: string, input: UpdateSubscriptionInput) =>
  apply(userId, id, async (s) => {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: s.productId } });
    const quantity = input.quantity ?? s.quantity;
    const cycleDays = input.cycleDays ?? s.cycleDays;
    return { type: "UPDATE", quantity, cycleDays, amount: subscriptionAmount(product.price, product.subscriptionDiscount, quantity) };
  });
