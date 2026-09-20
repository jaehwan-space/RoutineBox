import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@routinebox.local", password: "e2e-admin-pass!" };

export interface TestUser { email: string; password: string; name: string }

export function uniqueUser(tag: string): TestUser {
  return { email: `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@test.local`, password: "password123", name: `E2E ${tag}` };
}

/** 오늘(KST) + n 일 → YYYY-MM-DD */
export function kstDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export async function signup(page: Page, user: TestUser) {
  await page.goto("/signup");
  await page.getByLabel("이름").fill(user.name);
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel("비밀번호").fill(user.password);
  await page.getByRole("button", { name: "가입하기" }).click();
  await expect(page.getByRole("link", { name: `${user.name}님` })).toBeVisible();
}

export async function login(page: Page, user: { email: string; password: string; name?: string }) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(user.email);
  await page.getByLabel("비밀번호").fill(user.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
}

/** 브라우저 컨텍스트의 쿠키로 API 를 직접 호출한다 (화면으로 만들기 번거로운 사전 데이터용). */
export async function apiPost<T>(page: Page, path: string, data?: unknown): Promise<T> {
  const res = await page.request.post(`/api${path}`, { data });
  expect(res.ok(), `${path} → ${res.status()} ${await res.text()}`).toBeTruthy();
  return ((await res.json()) as { data: T }).data;
}

export async function apiGet<T>(page: Page, path: string): Promise<T> {
  const res = await page.request.get(`/api${path}`);
  expect(res.ok(), `${path} → ${res.status()}`).toBeTruthy();
  return ((await res.json()) as { data: T }).data;
}

/** 테스트 카드 + 오늘이 첫 결제일인 ACTIVE 구독을 만든다 (첫 배송일 = 오늘 + 3). */
export async function createActiveSubscription(page: Page) {
  const pm = await apiPost<{ id: string }>(page, "/payment-methods/mock");
  const products = await apiGet<{ items: Array<{ id: string; name: string }> }>(page, "/products?pageSize=1");
  const product = products.items[0];
  const sub = await apiPost<{ id: string; status: string; nextBillingDate: string }>(page, "/subscriptions", {
    productId: product.id, quantity: 1, cycleDays: 28, firstDeliveryDate: kstDate(3), paymentMethodId: pm.id,
  });
  expect(sub.status).toBe("ACTIVE");
  return { sub, product };
}
