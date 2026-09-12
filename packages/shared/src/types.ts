import type { AuthProvider, Role, SubscriptionStatus } from "./constants";

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

export interface SubscriptionSummary {
  id: string;
  status: SubscriptionStatus;
  productName: string;
  quantity: number;
  cycleDays: number;
  amount: number;
  nextBillingDate: string | null;
}
