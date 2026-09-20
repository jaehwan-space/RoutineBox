import { expect, test, type Page } from "@playwright/test";
import { kstDate, signup, uniqueUser } from "./helpers";

async function addToCart(page: Page, category: string, name: string) {
  await page.goto(`/products?category=${category}`);
  await page.getByRole("link", { name: new RegExp(`${name} 상세 보기`) }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await page.getByRole("button", { name: "담기" }).click();
  await expect(page.getByRole("status").filter({ hasText: "장바구니에 담았어요" })).toBeVisible();
}

test.describe("시나리오 6 · 장바구니에서 바로 구독 시작", () => {
  test("담은 상품 전부를 장바구니 시트에서 한 번에 구독한다", async ({ page }) => {
    await signup(page, uniqueUser("cartall"));
    await addToCart(page, "TISSUE", "3겹 화장지 30롤");
    await addToCart(page, "WATER", "생수 2L × 12병");

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: /장바구니 2개/ })).toBeVisible();
    await page.getByRole("button", { name: "전체 구독 시작하기" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "구독 시작" })).toBeVisible();
    await expect(dialog.getByLabel("첫 배송일")).toHaveValue(kstDate(3));

    // 화장지는 6주, 생수는 추천 주기 그대로. 카드가 없으면 안내 + 테스트 카드 등록
    await dialog.getByLabel("3겹 화장지 30롤 배송 주기").selectOption("42");
    await expect(dialog.getByText("등록된 카드가 없어요")).toBeVisible();
    await dialog.getByRole("button", { name: "테스트 카드 등록" }).click();
    await expect(dialog.getByLabel("결제 수단")).toContainText("테스트카드");
    await dialog.getByRole("button", { name: "구독 2개 시작하기" }).click();

    await expect(page).toHaveURL(/\/subscriptions$/);
    await expect(page.getByRole("status").filter({ hasText: "구독 2개를 시작했어요" })).toBeVisible();
    const tissue = page.getByRole("listitem").filter({ hasText: "3겹 화장지 30롤" });
    await expect(tissue.getByText("진행 중")).toBeVisible();
    await expect(tissue.getByText(/1개 · 6주마다/)).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "생수 2L × 12병" }).getByText("진행 중")).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText("장바구니가 비어 있어요")).toBeVisible();
  });

  test("장바구니에서 상품 하나만 골라 구독하면 그 상품만 빠지고 나머지는 남는다", async ({ page }) => {
    await signup(page, uniqueUser("cartone"));
    await addToCart(page, "TISSUE", "3겹 화장지 30롤");
    await addToCart(page, "WATER", "생수 2L × 12병");

    await page.goto("/cart");
    const tissueLine = page.getByRole("listitem").filter({ hasText: "3겹 화장지 30롤" });
    await tissueLine.getByRole("button", { name: "늘리기" }).click();
    await tissueLine.getByRole("button", { name: "이 상품만 구독" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "구독 설정" })).toBeVisible();
    await expect(dialog.getByRole("spinbutton", { name: "수량" })).toHaveAttribute("aria-valuenow", "2");
    await dialog.getByRole("button", { name: "테스트 카드 등록" }).click();
    await expect(dialog.getByLabel("결제 수단")).toBeVisible();
    await dialog.getByRole("button", { name: "구독 시작하기" }).click();

    // 다른 상품이 남아 있으므로 장바구니에 머문다
    await expect(page.getByRole("status").filter({ hasText: "구독을 시작했어요" })).toBeVisible();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole("listitem").filter({ hasText: "3겹 화장지 30롤" })).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: "생수 2L × 12병" })).toBeVisible();

    // 남은 상품을 일괄 시작 → 마지막이므로 내 구독으로 이동
    await page.getByRole("button", { name: "전체 구독 시작하기" }).click();
    await expect(page.getByRole("dialog").getByLabel("결제 수단")).toContainText("테스트카드");
    await page.getByRole("dialog").getByRole("button", { name: "구독 1개 시작하기" }).click();
    await expect(page).toHaveURL(/\/subscriptions$/);
    await expect(page.getByRole("listitem").filter({ hasText: "3겹 화장지 30롤" }).getByText(/2개 · 4주마다/)).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "생수 2L × 12병" }).getByText("진행 중")).toBeVisible();
  });
});
