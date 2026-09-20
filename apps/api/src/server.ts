import { createApp } from "./app.js";
import { config } from "./config.js";
import { mailEnabled } from "./lib/mailer.js";
import { tossKeyWarnings } from "./lib/toss.js";
import { startScheduler } from "./modules/billing/scheduler.js";

const app = createApp();
app.listen(config.API_PORT, () => {
  console.log(`[api] listening on http://localhost:${config.API_PORT} (${config.NODE_ENV})`);
  for (const warning of tossKeyWarnings()) console.warn(`[api] 경고: ${warning}`);
  if (!mailEnabled()) console.log("[api] SMTP 미설정 → 알림 메일은 이력만 남기고 발송하지 않습니다.");
  startScheduler();
});
