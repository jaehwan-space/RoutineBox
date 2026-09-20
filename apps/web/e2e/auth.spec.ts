import { expect, test } from "@playwright/test";
import { login, signup, uniqueUser } from "./helpers";

test.describe("시나리오 1 · 회원가입·로그인·로그아웃", () => {
  test("가입 후 바로 로그인 상태가 되고, 로그아웃·재로그인이 된다", async ({ page }) => {
    const user = uniqueUser("auth");
    await signup(page, user);

    await page.goto("/account");
    await expect(page.getByRole("heading", { name: `${user.name}님` })).toBeVisible();
    await expect(page.getByText(user.email)).toBeVisible();

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();

    await login(page, user);
    await expect(page.getByRole("link", { name: `${user.name}님` })).toBeVisible();
  });

  test("중복 이메일 가입과 잘못된 비밀번호 로그인은 오류를 보여준다", async ({ page }) => {
    const user = uniqueUser("dup");
    await signup(page, user);
    await page.getByRole("button", { name: "로그아웃" }).click();

    await page.goto("/signup");
    await page.getByLabel("이름").fill(user.name);
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel("비밀번호").fill(user.password);
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("이미 가입된 이메일입니다.")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("이메일").fill(user.email);
    await page.getByLabel("비밀번호").fill("wrong-password");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByText("이메일 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
  });
});
