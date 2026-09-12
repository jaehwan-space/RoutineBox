import type { AuthProvider, Category, Role, SubscriptionStatus } from "./constants";

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
  product: { id: string; name: string; category: Category };
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
