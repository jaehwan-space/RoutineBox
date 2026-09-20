import type { AuthProvider, Category, NotificationType, Role, SubscriptionStatus } from "./constants";

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  providers: AuthProvider[];
  createdAt: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  subscriptionDiscount: number;
  /** 할인 적용 구독가(10원 단위 내림) */
  subscriptionPrice: number;
  recommendedCycleDays: number;
  stock: number;
  imageUrl: string | null;
  /** 상세 정보 (없으면 null·빈 값) */
  brand: string | null;
  detailDescription: string;
  detailImages: string[];
  weight: string | null;
  unitOfSale: string | null;
  packagingType: string | null;
  deliveryType: string | null;
  origin: string | null;
  allergy: string | null;
}

export interface CategoryCountDto {
  category: Category;
  count: number;
}

export interface CartItemDto {
  productId: string;
  quantity: number;
  product: ProductDto;
  /** 구독가 × 수량 */
  lineTotal: number;
}

export interface CartDto {
  items: CartItemDto[];
  itemCount: number;
  total: number;
}

export interface PaymentMethodDto {
  id: string;
  cardCompany: string;
  cardLast4: string;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  orderKey: string;
  amount: number;
  quantity: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  deliveryStatus: "PREPARING" | "SHIPPED" | "DELIVERED";
  billingDate: string;
  deliveryDate: string;
  createdAt: string;
}

export interface SubscriptionDto {
  id: string;
  status: SubscriptionStatus;
  product: { id: string; name: string; category: Category; imageUrl: string | null };
  quantity: number;
  cycleDays: number;
  /** 회당 결제 금액(생성·변경 시점 스냅샷) */
  amount: number;
  firstDeliveryDate: string;
  nextBillingDate: string | null;
  nextDeliveryDate: string | null;
  failCount: number;
  paymentMethod: PaymentMethodDto | null;
  createdAt: string;
  orders?: OrderDto[];
}

export interface SubscriptionListDto {
  items: SubscriptionDto[];
  /** 이번 달 예정 결제 합계(ACTIVE) */
  monthlyDue: number;
  activeCount: number;
}

export interface ProductAdminDto extends ProductDto {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDto {
  status: "APPROVED" | "FAILED";
  amount: number;
  paymentKey: string | null;
  approvedAt: string | null;
  failReason: string | null;
}

/** 주문 목록 항목: 회차 + 어떤 구독·상품의 회차인지 */
export interface OrderListItemDto extends OrderDto {
  subscriptionId: string;
  product: { id: string; name: string; category: Category };
  cycleDays: number;
}

export interface OrderDetailDto extends OrderListItemDto {
  payment: PaymentDto | null;
  paymentMethod: { cardCompany: string; cardLast4: string } | null;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  subscriptionId: string | null;
  productName: string | null;
  sentAt: string;
}

/** 결제 배치 실행 결과 */
export interface BillingRunResult {
  asOf: string;
  processed: number;
  paid: number;
  failed: number;
  skipped: number;
  cancelled: number;
  items: Array<{ subscriptionId: string; orderKey: string; result: "PAID" | "FAILED" | "SKIPPED" | "CANCELLED" | "ERROR"; message?: string }>;
}

export interface AdminDashboardDto {
  activeSubscriptions: number;
  pausedSubscriptions: number;
  failedSubscriptions: number;
  todayDue: number;
  todayPaid: number;
  todayFailed: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  preparingOrders: number;
  users: number;
  /** 최근 14일 결제 건수 (오래된 날짜부터) */
  last14Days: Array<{ date: string; paid: number; failed: number; amount: number }>;
}

export interface AdminOrderDto extends OrderListItemDto {
  user: { id: string; email: string; name: string };
  payment: PaymentDto | null;
}

export interface AdminSubscriptionDto extends SubscriptionDto {
  user: { id: string; email: string; name: string };
  nextRetryAt: string | null;
  cancelledReason: string | null;
}

export interface AdminFailedPaymentDto {
  subscriptionId: string;
  user: { id: string; email: string; name: string };
  product: { id: string; name: string };
  amount: number;
  failCount: number;
  nextRetryAt: string | null;
  lastFailReason: string | null;
  lastFailedAt: string | null;
}
