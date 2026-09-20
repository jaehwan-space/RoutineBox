import type { BillingAuthInput, PaymentMethodDto } from "@routinebox/shared";
import { encryptSecret } from "../../lib/crypto.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { issueBillingKey } from "../../lib/toss.js";

export const customerKeyFor = (userId: string) => `cust_${userId}`;

const toDto = (pm: { id: string; cardCompany: string; cardLast4: string; createdAt: Date }): PaymentMethodDto =>
  ({ id: pm.id, cardCompany: pm.cardCompany, cardLast4: pm.cardLast4, createdAt: pm.createdAt.toISOString() });

export async function listMine(userId: string): Promise<PaymentMethodDto[]> {
  const rows = await prisma.paymentMethod.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: "desc" } });
  return rows.map(toDto);
}

/** 토스 카드 등록창 결과로 빌링키를 발급받아 암호화 저장 */
export async function registerFromBillingAuth(userId: string, input: BillingAuthInput): Promise<PaymentMethodDto> {
  if (input.customerKey !== customerKeyFor(userId)) throw new AppError("VALIDATION_ERROR", "customerKey 가 현재 사용자와 일치하지 않습니다.");
  const issued = await issueBillingKey(input.authKey, input.customerKey);
  const pm = await prisma.paymentMethod.create({
    data: { userId, customerKey: input.customerKey, billingKeyEnc: encryptSecret(issued.billingKey), cardCompany: issued.cardCompany, cardLast4: issued.cardLast4 },
  });
  return toDto(pm);
}

/** 개발 환경 전용 모의 결제수단 (PAYMENTS_MOCK=true) */
export async function registerMock(userId: string): Promise<PaymentMethodDto> {
  const pm = await prisma.paymentMethod.create({
    data: { userId, customerKey: customerKeyFor(userId), billingKeyEnc: encryptSecret(`mock_${userId}_${Date.now()}`), cardCompany: "테스트카드", cardLast4: "0000" },
  });
  return toDto(pm);
}

export async function remove(userId: string, id: string): Promise<void> {
  const pm = await prisma.paymentMethod.findFirst({ where: { id, userId, deletedAt: null } });
  if (!pm) throw new AppError("NOT_FOUND", "결제 수단을 찾을 수 없습니다.");
  const inUse = await prisma.subscription.count({ where: { paymentMethodId: id, status: { in: ["ACTIVE", "PAUSED", "PAYMENT_FAILED"] } } });
  if (inUse > 0) throw new AppError("CONFLICT", `이 카드를 쓰는 구독이 ${inUse}개 있어요. 구독의 결제 수단을 먼저 바꿔 주세요.`);
  await prisma.paymentMethod.update({ where: { id }, data: { deletedAt: new Date() } });
}
