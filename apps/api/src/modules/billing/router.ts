import { Router } from "express";
import { billingRunSchema, type BillingRunInput } from "@routinebox/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { runBilling, runBillingReminders } from "./service.js";

/** 운영 점검·시연용 수동 실행. 스케줄러와 같은 로직을 쓴다. */
export const billingRouter = Router();
billingRouter.use("/internal", requireAuth, requireRole("ADMIN"));

billingRouter.post("/internal/billing/run", validate(billingRunSchema), async (_req, res) => {
  const input = res.locals.body as BillingRunInput;
  res.json({ data: await runBilling({ asOf: input.asOf }) });
});

billingRouter.post("/internal/billing/remind", validate(billingRunSchema), async (_req, res) => {
  const input = res.locals.body as BillingRunInput;
  res.json({ data: await runBillingReminders({ asOf: input.asOf }) });
});
