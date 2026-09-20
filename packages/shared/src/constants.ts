export const SUBSCRIPTION_STATUSES = ["PENDING", "ACTIVE", "PAUSED", "PAYMENT_FAILED", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const ROLES = ["USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const AUTH_PROVIDERS = ["KAKAO", "GOOGLE"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

/** 카테고리 (표시 순서). 앞쪽은 식품, 뒤쪽은 생활용품. */
export const CATEGORIES = [
  "SALAD_MEAL", "FRUIT_NUT_RICE", "SOUP_SIDE_MAIN", "MEAT_EGG", "BAKERY_CHEESE_DELI", "SEAFOOD", "SNACK", "HEALTH",
  "WATER", "COFFEE", "DETERGENT", "TISSUE", "KITCHEN", "PET",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  SALAD_MEAL: "샐러드·간편식", FRUIT_NUT_RICE: "과일·견과·쌀", SOUP_SIDE_MAIN: "국·반찬·메인요리", MEAT_EGG: "정육·계란",
  BAKERY_CHEESE_DELI: "베이커리·치즈·델리", SEAFOOD: "수산·해산·건어물", SNACK: "간식·과자·떡", HEALTH: "건강식품",
  WATER: "생수", COFFEE: "커피", DETERGENT: "세제", TISSUE: "화장지", KITCHEN: "주방", PET: "반려용품",
};
/** 카테고리별 기본 추천 주기(일). 상품 임포트 시 기본값으로 쓴다. */
export const CATEGORY_CYCLE_DAYS: Record<Category, number> = {
  SALAD_MEAL: 7, FRUIT_NUT_RICE: 14, SOUP_SIDE_MAIN: 7, MEAT_EGG: 14, BAKERY_CHEESE_DELI: 14, SEAFOOD: 14, SNACK: 14, HEALTH: 28,
  WATER: 14, COFFEE: 28, DETERGENT: 28, TISSUE: 28, KITCHEN: 42, PET: 28,
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
