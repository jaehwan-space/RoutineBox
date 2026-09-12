export type ErrorCode =
  | "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"
  | "CONFLICT" | "INVALID_TRANSITION" | "PAYMENT_FAILED" | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
  CONFLICT: 409, INVALID_TRANSITION: 409, PAYMENT_FAILED: 402, INTERNAL: 500,
};

export class AppError extends Error {
  readonly status: number;
  constructor(readonly code: ErrorCode, message: string, readonly details?: unknown) {
    super(message);
    this.status = STATUS[code];
  }
}
