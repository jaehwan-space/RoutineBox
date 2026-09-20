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

export const ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = { PENDING: "결제 대기", PAID: "결제 완료", FAILED: "결제 실패", CANCELLED: "취소" };

export const DELIVERY_STATUSES = ["PREPARING", "SHIPPED", "DELIVERED"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = { PREPARING: "배송 준비 중", SHIPPED: "배송 중", DELIVERED: "배송 완료" };

export const NOTIFICATION_TYPES = ["SUBSCRIPTION_STARTED", "BILLING_D1", "PAYMENT_SUCCESS", "PAYMENT_FAILED", "SHIPPED", "SKIPPED", "CANCELLED"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SUBSCRIPTION_STARTED: "구독 시작", BILLING_D1: "내일 결제 예정", PAYMENT_SUCCESS: "결제 완료", PAYMENT_FAILED: "결제 실패",
  SHIPPED: "배송 출발", SKIPPED: "회차 건너뛰기", CANCELLED: "구독 해지",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: "카드 미등록", ACTIVE: "진행 중", PAUSED: "일시정지", PAYMENT_FAILED: "결제 실패", CANCELLED: "해지",
};
