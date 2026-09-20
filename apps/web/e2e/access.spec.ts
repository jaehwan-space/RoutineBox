import { expect, test } from "@playwright/test";
import { ADMIN, login, signup, uniqueUser } from "./helpers";

test.describe("시나리오 5 · 접근 제어 (보호 라우트·관리자 권한)", () => {
  test("비로그인은 로그인으로 보내고, 로그인 뒤 원래 화면으로 돌아온다", async ({ page }) => {
    const user = uniqueUser("access");
    await signup(page, user);
    await page.getByRole("button", { name: "로그아웃" }).click();

    await page.goto("/subscriptions");
    await expect(page).toHaveURL(/\/login\?next=%2Fsubscriptions/);
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel("비밀번호").fill(user.password);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/subscriptions$/);
    await expect(page.getByRole("heading", { name: "내 구독" })).toBeVisible();
  });

  test("일반 회원은 관리자 화면·API 에 접근할 수 없다", async ({ page }) => {
    await signup(page, uniqueUser("noadmin"));
    await expect(page.getByRole("link", { name: "관리자", exact: true })).toHaveCount(0);

    await page.goto("/admin");
    await expect(page.getByText("관리자만 볼 수 있는 화면이에요")).toBeVisible();
    await page.goto("/admin/orders");
    await expect(page.getByText("관리자만 볼 수 있는 화면이에요")).toBeVisible();

    expect((await page.request.get("/api/admin/dashboard")).status()).toBe(403);
    expect((await page.request.post("/api/internal/billing/run", { data: {} })).status()).toBe(403);
    expect((await page.request.post("/api/products", { data: { name: "x", category: "PET", price: 1000 } })).status()).toBe(403);
  });

  test("관리자는 관리자 메뉴가 보이고 상품을 등록·품절 처리할 수 있다", async ({ page }) => {
    await login(page, ADMIN);
    await page.getByRole("link", { name: "관리자", exact: true }).click();
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

    await page.getByRole("navigation", { name: "관리자 메뉴" }).getByRole("link", { name: "상품", exact: true }).click();
    await page.getByRole("button", { name: "상품 등록" }).click();
    const name = `E2E 상품 ${Date.now()}`;
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("상품명").fill(name);
    await dialog.getByLabel("정가(원)").fill("8000");
    await dialog.getByLabel("재고").fill("5");
    await dialog.getByRole("button", { name: "등록" }).click();
    await expect(page.getByRole("status").filter({ hasText: "상품을 등록했어요" })).toBeVisible();

    await page.getByLabel("상품명 검색").fill(name);
    const row = page.getByRole("row").filter({ hasText: name });
    await expect(row.getByText("7,600원")).toBeVisible();
    await row.getByRole("button", { name: "품절 처리" }).click();
    await expect(row.getByText("품절")).toBeVisible();
  });
});
