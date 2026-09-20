import { expect, test } from "@playwright/test";
import { ADMIN, createActiveSubscription, kstDate, login, signup, uniqueUser } from "./helpers";

test.describe("시나리오 4 · 자동 결제 배치 → 주문·알림 → 관리자 배송 처리", () => {
  test("관리자가 결제 배치를 실행하면 회원의 주문·알림에 회차가 생기고, 배송 상태 변경이 반영된다", async ({ browser, page }) => {
    const user = uniqueUser("bill");
    await signup(page, user);
    const { sub, product } = await createActiveSubscription(page);
    expect(sub.nextBillingDate).toBe(kstDate(0));

    await page.goto("/orders");
    await expect(page.getByText("아직 주문이 없어요")).toBeVisible();

    // 관리자: 대시보드에서 오늘 기준 결제 배치 실행
    const adminCtx = await browser.newContext({ locale: "ko-KR", timezoneId: "Asia/Seoul" });
    const admin = await adminCtx.newPage();
    await login(admin, ADMIN);
    await admin.goto("/admin");
    await expect(admin.getByRole("heading", { name: "대시보드" })).toBeVisible();
    await expect(admin.getByText("진행 중 구독")).toBeVisible();
    await admin.getByRole("button", { name: "결제 배치 실행" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "결제 배치 완료" })).toBeVisible();
    await expect(admin.getByText(`sub_${sub.id}_`)).toBeVisible();

    // 관리자: 주문 목록에서 회원의 주문을 찾아 배송 중으로 변경
    await admin.goto("/admin/orders");
    await admin.getByLabel("검색", { exact: true }).fill(user.email);
    const row = admin.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(row.getByText("결제 완료")).toBeVisible();
    await row.getByRole("combobox").selectOption("SHIPPED");
    await expect(admin.getByRole("status").filter({ hasText: "배송 상태를 바꿨어요" })).toBeVisible();

    // 관리자: 구독 현황
    await admin.goto("/admin/subscriptions");
    await admin.getByLabel("검색", { exact: true }).fill(user.email);
    await expect(admin.getByRole("row").filter({ hasText: user.email }).getByText("진행 중")).toBeVisible();
    await adminCtx.close();

    // 회원: 주문 내역·상세·알림
    await page.goto("/orders");
    const order = page.getByRole("listitem").filter({ hasText: product.name });
    await expect(order.getByText("결제 완료")).toBeVisible();
    await expect(order.getByText("배송 중")).toBeVisible();
    await order.getByRole("link").first().click();
    await expect(page.getByRole("heading", { name: /배송 · 배송 중/ })).toBeVisible();
    await expect(page.getByText(/승인 \d{4}/)).toBeVisible();
    await expect(page.getByText("테스트카드 **** 0000")).toBeVisible();

    await page.goto("/subscriptions");
    const card = page.getByRole("listitem").filter({ hasText: product.name });
    await expect(card.getByText("D-28")).toBeVisible();

    await page.goto("/notifications");
    await expect(page.getByText(/결제 완료 · /)).toBeVisible();
    await expect(page.getByText(/배송 출발 · /)).toBeVisible();

    // 같은 회차는 다시 실행해도 중복 결제되지 않는다
    const again = await page.request.get("/api/orders");
    expect(((await again.json()) as { data: { total: number } }).data.total).toBe(1);
  });
});
