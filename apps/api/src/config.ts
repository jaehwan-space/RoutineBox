import "./env.js";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().default(4000),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("14d"),
  COOKIE_SECURE: z.stringbool().default(false), // "true"/"false" 문자열을 정확히 해석
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  KAKAO_REDIRECT_URI: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  TOSS_CLIENT_KEY: z.string().optional(),
  TOSS_SECRET_KEY: z.string().optional(),
  BILLING_KEY_ENCRYPTION_KEY: z.string().optional(),
  PAYMENTS_MOCK: z.stringbool().default(false),
  // 자동 결제 스케줄러 (Asia/Seoul). 테스트·점검 시 BILLING_CRON_ENABLED=false 로 끈다.
  BILLING_CRON_ENABLED: z.stringbool().default(true),
  BILLING_CRON: z.string().default("0 9 * * *"),
  REMINDER_CRON: z.string().default("5 9 * * *"),
  // 이메일 (SMTP_HOST 가 비어 있으면 발송을 건너뛰고 알림 이력만 남긴다)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("RoutineBox <no-reply@example.com>"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("환경 변수 오류:", z.treeifyError(parsed.error));
  process.exit(1);
}
export const config = parsed.data;
export const isProd = config.NODE_ENV === "production";
