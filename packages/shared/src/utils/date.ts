import { BILLING_LEAD_DAYS } from "../constants";

/** "YYYY-MM-DD" 형식의 날짜 문자열(KST 기준 달력 날짜) */
export type YMD = string;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isYmd = (s: string): s is YMD => YMD_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

/** 오늘 날짜(Asia/Seoul) */
export function todayKst(now: Date = new Date()): YMD {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** DB @db.Date 컬럼용: 달력 날짜를 UTC 자정 Date 로 */
export const toDbDate = (ymd: YMD): Date => new Date(`${ymd}T00:00:00.000Z`);
/** DB Date → "YYYY-MM-DD" */
export const fromDbDate = (d: Date): YMD => d.toISOString().slice(0, 10);

export function addDays(ymd: YMD, days: number): YMD {
  const d = toDbDate(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDbDate(d);
}

/** b − a (일) */
export function daysBetween(a: YMD, b: YMD): number {
  return Math.round((toDbDate(b).getTime() - toDbDate(a).getTime()) / 86_400_000);
}

/** 결제일 = 배송일 − 리드타임 */
export const billingDateFor = (deliveryDate: YMD): YMD => addDays(deliveryDate, -BILLING_LEAD_DAYS);
/** 배송일 = 결제일 + 리드타임 */
export const deliveryDateFor = (billingDate: YMD): YMD => addDays(billingDate, BILLING_LEAD_DAYS);

/** 같은 달인지 ("YYYY-MM" 비교) */
export const sameMonth = (a: YMD, b: YMD): boolean => a.slice(0, 7) === b.slice(0, 7);

/** 화면용: 9/05 (금) */
export function formatShortDate(ymd: YMD): string {
  const d = toDbDate(ymd);
  const day = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  return `${d.getUTCMonth() + 1}/${String(d.getUTCDate()).padStart(2, "0")} (${day})`;
}
