import { Router } from "express";
import {
  adminOrderQuerySchema, adminProductQuerySchema, adminSubscriptionQuerySchema, updateDeliveryStatusSchema,
  type AdminOrderQuery, type AdminProductQuery, type AdminSubscriptionQuery, type UpdateDeliveryStatusInput,
} from "@routinebox/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as products from "../product/service.js";
import * as admin from "./service.js";

export const adminRouter = Router();
adminRouter.use("/admin", requireAuth, requireRole("ADMIN"));

adminRouter.get("/admin/dashboard", async (_req, res) => {
  res.json({ data: await admin.dashboard() });
});
adminRouter.get("/admin/products", validate(adminProductQuerySchema, "query"), async (_req, res) => {
  res.json({ data: await products.listAllProducts(res.locals.query as AdminProductQuery) });
});
adminRouter.get("/admin/orders", validate(adminOrderQuerySchema, "query"), async (_req, res) => {
  res.json({ data: await admin.listOrders(res.locals.query as AdminOrderQuery) });
});
adminRouter.patch("/admin/orders/:id/delivery", validate(updateDeliveryStatusSchema), async (req, res) => {
  res.json({ data: await admin.updateDelivery(String(req.params.id), res.locals.body as UpdateDeliveryStatusInput) });
});
adminRouter.get("/admin/subscriptions", validate(adminSubscriptionQuerySchema, "query"), async (_req, res) => {
  res.json({ data: await admin.listSubscriptions(res.locals.query as AdminSubscriptionQuery) });
});
adminRouter.get("/admin/payments/failed", async (_req, res) => {
  res.json({ data: await admin.failedPayments() });
});
