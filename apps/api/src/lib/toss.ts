import { tossBillingKeyProblem } from "@routinebox/shared";
import { config } from "../config.js";
import { AppError } from "./errors.js";

const BASE = "https://api.tosspayments.com";

function authHeader(): string {
  const problem = tossBillingKeyProblem(config.TOSS_SECRET_KEY, "secret", "TOSS_SECRET_KEY");
  if (problem) throw new AppError("INTERNAL", problem);
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

/** 서버 시작 시 출력할 키 설정 경고. 키가 비어 있는 것은 (결제 연동 전이라) 경고하지 않고, 종류가 틀린 키만 알린다. */
export function tossKeyWarnings(): string[] {
  const checks = [
    ["TOSS_SECRET_KEY", config.TOSS_SECRET_KEY, "secret"],
    ["TOSS_CLIENT_KEY", config.TOSS_CLIENT_KEY, "client"],
  ] as const;
  return checks.flatMap(([envName, key, role]) => (key ? [tossBillingKeyProblem(key, role, envName)] : [])).filter((m): m is string => Boolean(m));
}
