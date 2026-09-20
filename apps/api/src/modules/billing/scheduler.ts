import cron from "node-cron";
import { config } from "../../config.js";
import { runBilling, runBillingReminders } from "./service.js";

/** 매일 09:00 결제 배치, 09:05 D-1 알림 (Asia/Seoul). server.ts 에서만 시작한다(테스트는 부르지 않음). */
export function startScheduler(): void {
  if (!config.BILLING_CRON_ENABLED) {
    console.log("[scheduler] BILLING_CRON_ENABLED=false → 자동 결제 스케줄러를 시작하지 않습니다.");
    return;
  }
  cron.schedule(config.BILLING_CRON, async () => {
    try {
      const r = await runBilling();
      console.log(`[billing] ${r.asOf} 처리 ${r.processed} · 성공 ${r.paid} · 실패 ${r.failed} (자동 해지 ${r.cancelled}) · 건너뜀 ${r.skipped}`);
    } catch (err) {
      console.error("[billing] 배치 오류:", err);
    }
  }, { timezone: "Asia/Seoul", name: "billing" });
  cron.schedule(config.REMINDER_CRON, async () => {
    try {
      const r = await runBillingReminders();
      console.log(`[reminder] ${r.asOf} D-1 알림 발송 ${r.sent} · 건너뜀 ${r.skipped}`);
    } catch (err) {
      console.error("[reminder] 배치 오류:", err);
    }
  }, { timezone: "Asia/Seoul", name: "reminder" });
  console.log(`[scheduler] 결제 배치 "${config.BILLING_CRON}", D-1 알림 "${config.REMINDER_CRON}" (Asia/Seoul)`);
}
