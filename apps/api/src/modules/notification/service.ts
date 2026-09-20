import type { NotificationType, Prisma } from "@prisma/client";
import { formatKrw, formatShortDate, type NotificationDto, type YMD } from "@routinebox/shared";
import { config } from "../../config.js";
import { sendMail } from "../../lib/mailer.js";
import { prisma } from "../../lib/prisma.js";

type Db = Prisma.TransactionClient | typeof prisma;

export interface RecordInput { userId: string; subscriptionId?: string | null; type: NotificationType; periodKey?: string | null }

/**
 * 알림 이력을 남긴다. 같은 (구독, 종류, 회차) 는 유니크라 이미 있으면 false 를 돌려준다 (중복 발송 방지).
 * 트랜잭션 안에서 쓰려면 tx 를 넘긴다.
 */
export async function record(input: RecordInput, db: Db = prisma): Promise<boolean> {
  try {
    await db.notification.create({ data: { userId: input.userId, subscriptionId: input.subscriptionId ?? null, type: input.type, periodKey: input.periodKey ?? null } });
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return false;
    throw err;
  }
}

export interface MailContext {
  user: { email: string; name: string };
  productName: string;
  amount?: number;
  quantity?: number;
  billingDate?: YMD | null;
  deliveryDate?: YMD | null;
  failReason?: string | null;
  failCount?: number;
}

const APP = config.APP_URL;
const wrap = (title: string, lines: string[], cta?: { label: string; href: string }) => ({
  text: [title, "", ...lines, "", cta ? `${cta.label}: ${cta.href}` : ""].join("\n").trim(),
  html: `<div style="font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2118">
  <h2 style="margin:0 0 16px;font-size:20px">${title}</h2>
  ${lines.map((l) => `<p style="margin:0 0 8px;font-size:15px;line-height:1.55">${l}</p>`).join("")}
  ${cta ? `<p style="margin:20px 0 0"><a href="${cta.href}" style="display:inline-block;padding:10px 16px;background:#5e6b2f;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${cta.label}</a></p>` : ""}
  <p style="margin:24px 0 0;font-size:12px;color:#6b6357">루틴박스 · 생활필수품 정기배송</p></div>`,
});

/** 알림 종류별 메일 본문. 메일이 필요 없는 종류는 null. */
export function mailFor(type: NotificationType, ctx: MailContext): { subject: string; text: string; html: string } | null {
  const name = ctx.user.name;
  const subs = { label: "내 구독 보기", href: `${APP}/subscriptions` };
  switch (type) {
    case "BILLING_D1":
      return { subject: `[루틴박스] 내일 ${ctx.productName} 정기결제가 예정되어 있어요`, ...wrap(`${name}님, 내일 결제 예정이에요`, [
        `상품: ${ctx.productName}${ctx.quantity ? ` ${ctx.quantity}개` : ""}`,
        `결제 예정일: ${ctx.billingDate ? formatShortDate(ctx.billingDate) : "-"} · 금액: ${ctx.amount !== undefined ? formatKrw(ctx.amount) : "-"}`,
        "이번 회차를 받지 않으려면 결제 전에 건너뛰기나 일시정지를 해 주세요.",
      ], subs) };
    case "PAYMENT_SUCCESS":
      return { subject: `[루틴박스] ${ctx.productName} 결제가 완료되었어요`, ...wrap(`${name}님, 결제가 완료되었어요`, [
        `상품: ${ctx.productName}${ctx.quantity ? ` ${ctx.quantity}개` : ""} · 금액: ${ctx.amount !== undefined ? formatKrw(ctx.amount) : "-"}`,
        `배송 예정일: ${ctx.deliveryDate ? formatShortDate(ctx.deliveryDate) : "-"}`,
      ], { label: "주문 내역 보기", href: `${APP}/orders` }) };
    case "PAYMENT_FAILED":
      return { subject: `[루틴박스] ${ctx.productName} 결제에 실패했어요`, ...wrap(`${name}님, 카드 승인에 실패했어요`, [
        `상품: ${ctx.productName} · 금액: ${ctx.amount !== undefined ? formatKrw(ctx.amount) : "-"}`,
        `사유: ${ctx.failReason ?? "카드사 승인 거절"}`,
        `내일 09:00에 다시 시도합니다 (${ctx.failCount ?? 1}/3). 3회 연속 실패하면 구독이 자동 해지돼요. 다른 카드로 바꾸려면 결제 수단을 변경해 주세요.`,
      ], { label: "결제 수단 변경", href: `${APP}/account/payment-methods` }) };
    case "SHIPPED":
      return { subject: `[루틴박스] ${ctx.productName} 배송이 시작되었어요`, ...wrap(`${name}님, 상품이 출발했어요`, [
        `상품: ${ctx.productName}${ctx.quantity ? ` ${ctx.quantity}개` : ""}`,
        `배송 예정일: ${ctx.deliveryDate ? formatShortDate(ctx.deliveryDate) : "-"}`,
      ], { label: "주문 내역 보기", href: `${APP}/orders` }) };
    case "CANCELLED":
      return { subject: `[루틴박스] ${ctx.productName} 구독이 자동 해지되었어요`, ...wrap(`${name}님, 구독이 해지되었어요`, [
        `상품: ${ctx.productName}`,
        "결제가 3회 연속 실패해 구독을 자동으로 해지했어요. 다시 받으시려면 카드를 등록한 뒤 새로 구독해 주세요.",
      ], subs) };
    default:
      return null;
  }
}

/** 메일 발송 (실패해도 배치를 막지 않도록 오류는 로그만 남긴다). */
export async function notifyByMail(type: NotificationType, ctx: MailContext): Promise<void> {
  const mail = mailFor(type, ctx);
  if (!mail) return;
  try {
    await sendMail({ to: ctx.user.email, ...mail });
  } catch (err) {
    console.error(`[mail] ${type} → ${ctx.user.email} 발송 실패:`, err);
  }
}

export async function listMine(userId: string, limit = 50): Promise<NotificationDto[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: limit,
    include: { subscription: { select: { product: { select: { name: true } } } } },
  });
  return rows.map((n) => ({ id: n.id, type: n.type, subscriptionId: n.subscriptionId, productName: n.subscription?.product.name ?? null, sentAt: n.sentAt.toISOString() }));
}
