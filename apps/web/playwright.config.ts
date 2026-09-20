import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const ROOT = path.resolve(__dirname, "../..");
const CI = Boolean(process.env.CI);

/**
 * E2E: 실제 API·DB 를 띄우고 브라우저로 핵심 흐름 5개를 검증한다.
 *   pnpm --filter @routinebox/web e2e          (로컬: 이미 떠 있는 dev 서버가 있으면 재사용)
 * 전제: PostgreSQL(pnpm db:up), 루트 .env 의 PAYMENTS_MOCK=true·NEXT_PUBLIC_PAYMENTS_MOCK=true.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: CI ? "retain-on-failure" : "off",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      // 나머지 값(DATABASE_URL·JWT·BILLING_KEY_ENCRYPTION_KEY 등)은 로컬에서는 루트 .env, CI 에서는 워크플로 env 에서 온다.
      command: CI ? "pnpm --filter @routinebox/api start" : "pnpm --filter @routinebox/api dev",
      url: "http://localhost:4000/health",
      cwd: ROOT,
      reuseExistingServer: !CI,
      timeout: 90_000,
      env: { BILLING_CRON_ENABLED: "false", PAYMENTS_MOCK: "true" },
    },
    {
      command: CI ? "pnpm --filter @routinebox/web start" : "pnpm --filter @routinebox/web dev",
      url: "http://localhost:3000",
      cwd: ROOT,
      reuseExistingServer: !CI,
      timeout: 180_000,
      env: { NEXT_PUBLIC_PAYMENTS_MOCK: "true", API_INTERNAL_URL: "http://localhost:4000" },
    },
  ],
});
