import { config } from "../config.js";
import { AppError } from "./errors.js";

const BASE = "https://api.tosspayments.com";

function authHeader(): string {
  if (!config.TOSS_SECRET_KEY) throw new AppError("INTERNAL", "토스페이먼츠 시크릿 키가 설정되지 않았습니다.");
  return `Basic ${Buffer.from(`${config.TOSS_SECRET_KEY}:`).toString("base64")}`;
}

export interface BillingKeyResult { billingKey: string; cardCompany: string; cardLast4: string; raw: unknown }

/** 카드 등록창의 authKey → 빌링키 발급 (POST /v1/billing/authorizations/issue) */
export async function issueBillingKey(authKey: string, customerKey: string): Promise<BillingKeyResult> {
  const res = await fetch(`${BASE}/v1/billing/authorizations/issue`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ authKey, customerKey }),
  });
  const body = (await res.json().catch(() => ({}))) as { billingKey?: string; card?: { issuerCode?: string; number?: string }; cardCompany?: string; message?: string; code?: string };
  if (!res.ok || !body.billingKey) {
    throw new AppError("PAYMENT_FAILED", body.message ?? "카드 등록에 실패했습니다.", { code: body.code });
  }
  const number = body.card?.number ?? "";
  return { billingKey: body.billingKey, cardCompany: body.cardCompany ?? body.card?.issuerCode ?? "카드", cardLast4: number.replace(/\D/g, "").slice(-4) || "****", raw: body };
}

export const isTossConfigured = () => Boolean(config.TOSS_SECRET_KEY);
