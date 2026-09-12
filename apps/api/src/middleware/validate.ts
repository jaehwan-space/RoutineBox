import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { z } from "zod";
import { AppError } from "../lib/errors.js";

/** zod 스키마로 body 또는 query를 검증하고 파싱 결과를 res.locals 에 넣는다. */
export function validate<T>(schema: ZodType<T>, source: "body" | "query" = "body"): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new AppError("VALIDATION_ERROR", "입력값이 올바르지 않습니다.", z.flattenError(result.error).fieldErrors));
      return;
    }
    res.locals[source] = result.data;
    next();
  };
}
