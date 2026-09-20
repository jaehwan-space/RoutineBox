import { Router } from "express";
import { getAuth, requireAuth } from "../../middleware/auth.js";
import * as notifications from "./service.js";

export const notificationRouter = Router();
notificationRouter.use("/notifications", requireAuth);

notificationRouter.get("/notifications", async (_req, res) => {
  res.json({ data: await notifications.listMine(getAuth(res).userId) });
});
