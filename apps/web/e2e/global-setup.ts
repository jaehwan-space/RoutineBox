import { execSync } from "node:child_process";
import path from "node:path";
import { ADMIN } from "./helpers";

/** 상품 시드 + 관리자 계정(admin@routinebox.local) 을 준비한다. 이미 있으면 비밀번호·역할만 맞춘다. */
export default async function globalSetup() {
  const root = path.resolve(__dirname, "../../..");
  execSync("pnpm --filter @routinebox/api db:seed", { cwd: root, stdio: "inherit", env: { ...process.env, SEED_ADMIN_PASSWORD: ADMIN.password } });
}
