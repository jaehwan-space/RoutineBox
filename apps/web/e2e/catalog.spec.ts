import { expect, test } from "@playwright/test";
import { signup, uniqueUser } from "./helpers";

test.describe("시나리오 2 · 상품 탐색·검색·장바구니", () => {
  test("카테고리·검색으로 상품을 찾고 상세에서 장바구니에 담는다", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /전체 상품/ })).toBeVisible();

    await page.getByRole("link", { name: "생수", exact: true }).first().click();
    await expect(page).toHaveURL(/category=WATER/);
    await expect(page.getByRole("heading", { level: 1, name: /생수/ })).toBeVisible();

    // 카테고리 안에서는 검색이 카테고리로 한정되므로 전체 상품에서 검색한다
    await page.goto("/products");
    const search = page.getByRole("search").last().getByLabel("상품 검색");
    await search.fill("원두");
    await search.press("Enter");
    await expect(page.getByRole("heading", { name: /원두.*검색 결과/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /원두 1kg 상세 보기/ })).toBeVisible();

    await page.getByRole("link", { name: /원두 1kg 상세 보기/ }).click();
    await expect(page).toHaveURL(/\/products\/[^/?]+$/);
    await expect(page.getByRole("heading", { level: 1, name: "원두 1kg" })).toBeVisible();
    await expect(page.getByText(/구독 5% 할인/).first()).toBeVisible();

    await page.getByRole("button", { name: "담기" }).click();
    await expect(page.getByRole("link", { name: "장바구니 1개" })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /장바구니/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "원두 1kg" })).toBeVisible();
  });

  test("게스트 장바구니는 로그인 후 계정에 병합된다", async ({ page }) => {
    await page.goto("/products?category=WATER");
    await page.getByRole("link", { name: /생수 2L × 12병 상세 보기/ }).click();
    await expect(page).toHaveURL(/\/products\/[^/?]+$/);
    await expect(page.getByRole("heading", { level: 1, name: "생수 2L × 12병" })).toBeVisible();
    await page.getByRole("button", { name: "담기" }).click();
    await expect(page.getByRole("link", { name: "장바구니 1개" })).toBeVisible();

    await signup(page, uniqueUser("cart"));
    await page.goto("/cart");
    await expect(page.getByRole("link", { name: "생수 2L × 12병" })).toBeVisible();
    await expect(page.getByText(/회당 결제 예상/)).toBeVisible();
  });
});
