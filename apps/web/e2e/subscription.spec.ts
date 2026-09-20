import { expect, test } from "@playwright/test";
import { kstDate, signup, uniqueUser } from "./helpers";

test.describe("시나리오 3 · 테스트 카드 등록 → 구독 생성 → 관리(건너뛰기·일시정지·재개·해지)", () => {
  test("구독 설정 모달에서 카드를 등록해 구독을 시작하고 상태를 바꾼다", async ({ page }) => {
    await signup(page, uniqueUser("sub"));

    await page.goto("/products?category=TISSUE");
    await page.getByRole("link", { name: /3겹 화장지 30롤 상세 보기/ }).click();
    await page.getByRole("button", { name: "구독 설정하기" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "구독 설정" })).toBeVisible();

    // 카드가 없으면 안내 + 테스트 카드 등록 → 결제 수단 선택으로 바뀐다
    await expect(dialog.getByText("등록된 카드가 없어요")).toBeVisible();
    await dialog.getByRole("button", { name: "테스트 카드 등록" }).click();
    await expect(dialog.getByLabel("결제 수단")).toBeVisible();
    await expect(dialog.getByLabel("결제 수단")).toContainText("테스트카드");

    // 주기 6주, 수량 2 → 회당 금액 = 15,100 × 2 = 30,200원
    await dialog.getByRole("button", { name: "6주" }).click();
    await dialog.getByRole("button", { name: "늘리기" }).click();
    await expect(dialog.getByText("30,200원")).toBeVisible();
    await expect(dialog.getByLabel("첫 배송일")).toHaveValue(kstDate(3));
    await dialog.getByRole("button", { name: "구독 시작하기" }).click();

    await expect(page).toHaveURL(/\/subscriptions$/);
    const card = page.getByRole("listitem").filter({ hasText: "3겹 화장지 30롤" });
    await expect(card.getByText("진행 중")).toBeVisible();
    await expect(card.getByText("2개 · 6주마다 · 회당 30,200원")).toBeVisible();
    await expect(card.getByText("오늘 결제")).toBeVisible();
    await expect(page.getByText("이번 달 예정 결제")).toBeVisible();

    await card.getByRole("button", { name: "건너뛰기" }).click();
    await expect(page.getByRole("status").filter({ hasText: "이번 회차를 건너뛰었어요" })).toBeVisible();
    await expect(card.getByText("D-42")).toBeVisible();

    await card.getByRole("button", { name: "일시정지" }).click();
    await expect(card.getByText("일시정지 중이에요")).toBeVisible();
    await card.getByRole("button", { name: "재개" }).click();
    await expect(card.getByText("진행 중")).toBeVisible();
    await expect(card.getByText("D-3")).toBeVisible();

    await card.getByRole("button", { name: "해지" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "해지" }).click();
    await expect(page.getByText("해지한 구독 1개")).toBeVisible();

    // 해지된 구독의 카드는 삭제할 수 있다
    await page.goto("/account/payment-methods");
    await page.getByRole("button", { name: /테스트카드 0000 삭제/ }).click();
    await expect(page.getByText("등록된 카드가 없어요")).toBeVisible();
  });
});
