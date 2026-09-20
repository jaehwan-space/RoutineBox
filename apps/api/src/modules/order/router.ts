import { Router } from "express";
import { orderQuerySchema, type OrderQuery } from "@routinebox/shared";
import { getAuth, requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as orders from "./service.js";

export const orderRouter = Router();
orderRouter.use("/orders", requireAuth);

orderRouter.get("/orders", validate(orderQuerySchema, "query"), async (_req, res) => {
  res.json({ data: await orders.listMine(getAuth(res).userId, res.locals.query as OrderQuery) });
});

orderRouter.get("/orders/:id", async (req, res) => {
  res.json({ data: await orders.getMine(getAuth(res).userId, String(req.params.id)) });
});
