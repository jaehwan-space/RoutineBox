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

export interface SubscriptionSummary {
  id: string;
  status: SubscriptionStatus;
  productName: string;
  quantity: number;
  cycleDays: number;
  amount: number;
  nextBillingDate: string | null;
}
