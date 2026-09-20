import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }
  res.status(db === "ok" ? 200 : 503).json({ data: { status: db === "ok" ? "ok" : "degraded", db, time: new Date().toISOString() } });
});
