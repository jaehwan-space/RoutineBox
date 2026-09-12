import { Router } from "express";
import {
  activateSubscriptionSchema, createSubscriptionSchema, resumeSubscriptionSchema, updateSubscriptionSchema,
  type ActivateSubscriptionInput, type CreateSubscriptionInput, type ResumeSubscriptionInput, type UpdateSubscriptionInput,
} from "@routinebox/shared";
import { getAuth, requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as subs from "./service.js";

export const subscriptionRouter = Router();
subscriptionRouter.use("/subscriptions", requireAuth);

subscriptionRouter.get("/subscriptions", async (_req, res) => {
  res.json({ data: await subs.listMine(getAuth(res).userId) });
});
subscriptionRouter.post("/subscriptions", validate(createSubscriptionSchema), async (_req, res) => {
  res.status(201).json({ data: await subs.create(getAuth(res).userId, res.locals.body as CreateSubscriptionInput) });
});
subscriptionRouter.get("/subscriptions/:id", async (req, res) => {
  res.json({ data: await subs.getMine(getAuth(res).userId, String(req.params.id)) });
});
subscriptionRouter.patch("/subscriptions/:id", validate(updateSubscriptionSchema), async (req, res) => {
  res.json({ data: await subs.update(getAuth(res).userId, String(req.params.id), res.locals.body as UpdateSubscriptionInput) });
});
subscriptionRouter.post("/subscriptions/:id/skip", async (req, res) => {
  res.json({ data: await subs.skip(getAuth(res).userId, String(req.params.id)) });
});
subscriptionRouter.post("/subscriptions/:id/pause", async (req, res) => {
  res.json({ data: await subs.pause(getAuth(res).userId, String(req.params.id)) });
});
subscriptionRouter.post("/subscriptions/:id/resume", validate(resumeSubscriptionSchema), async (req, res) => {
  res.json({ data: await subs.resume(getAuth(res).userId, String(req.params.id), res.locals.body as ResumeSubscriptionInput) });
});
subscriptionRouter.post("/subscriptions/:id/cancel", async (req, res) => {
  res.json({ data: await subs.cancel(getAuth(res).userId, String(req.params.id)) });
});
subscriptionRouter.post("/subscriptions/:id/activate", validate(activateSubscriptionSchema), async (req, res) => {
  res.json({ data: await subs.activate(getAuth(res).userId, String(req.params.id), res.locals.body as ActivateSubscriptionInput) });
});
