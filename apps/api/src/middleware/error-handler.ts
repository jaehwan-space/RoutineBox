import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "JSON 본문이 올바르지 않습니다." } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "서버 오류가 발생했습니다." } });
};
