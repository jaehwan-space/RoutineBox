export const SUBSCRIPTION_STATUSES = ["PENDING", "ACTIVE", "PAUSED", "PAYMENT_FAILED", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const ROLES = ["USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const AUTH_PROVIDERS = ["KAKAO", "GOOGLE"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const CATEGORIES = ["DETERGENT", "TISSUE", "WATER", "COFFEE", "KITCHEN", "PET"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  DETERGENT: "세제", TISSUE: "화장지", WATER: "생수", COFFEE: "커피", KITCHEN: "주방", PET: "반려용품",
};

/** 배송 주기 프리셋(일). 직접 입력은 MIN~MAX 범위 */
export const CYCLE_PRESETS = [14, 28, 42, 56] as const;
export const CYCLE_MIN_DAYS = 7;
export const CYCLE_MAX_DAYS = 90;
/** 결제일 = 배송일 − BILLING_LEAD_DAYS */
export const BILLING_LEAD_DAYS = 3;
export const MAX_PAYMENT_RETRY = 3;
