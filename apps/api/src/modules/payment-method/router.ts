import { Router } from "express";
import { billingAuthSchema, mockPaymentsAllowed, type BillingAuthInput } from "@routinebox/shared";
import { config, isProd } from "../../config.js";
import { getAuth, requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as pm from "./service.js";

export const paymentMethodRouter = Router();
paymentMethodRouter.use("/payment-methods", requireAuth);

paymentMethodRouter.get("/payment-methods", async (_req, res) => {
  res.json({ data: await pm.listMine(getAuth(res).userId) });
});

paymentMethodRouter.post("/payment-methods/billing-auth", validate(billingAuthSchema), async (_req, res) => {
  res.status(201).json({ data: await pm.registerFromBillingAuth(getAuth(res).userId, res.locals.body as BillingAuthInput) });
});

/** 모의 결제수단: PAYMENTS_MOCK 이 꺼져 있거나, 운영에서 테스트 시크릿 키(test_sk_)가 아니면 라우트 자체를 등록하지 않는다. */
if (mockPaymentsAllowed({ mockFlag: config.PAYMENTS_MOCK, production: isProd, secretKey: config.TOSS_SECRET_KEY })) {
  paymentMethodRouter.post("/payment-methods/mock", async (_req, res) => {
    res.status(201).json({ data: await pm.registerMock(getAuth(res).userId) });
  });
}

paymentMethodRouter.delete("/payment-methods/:id", async (req, res) => {
  await pm.remove(getAuth(res).userId, String(req.params.id));
  res.status(204).end();
});
