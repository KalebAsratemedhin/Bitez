import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../http/errors.js";

export function requireInternalServiceToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const expected = process.env.INTERNAL_SERVICE_TOKEN?.trim();
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      next(
        new AppError({
          code: "INTERNAL",
          status: 503,
          message: "Service misconfigured",
          expose: false,
        }),
      );
      return;
    }
    next();
    return;
  }
  const provided = req.header("x-internal-token")?.trim();
  if (provided !== expected) {
    next(new AppError({ code: "FORBIDDEN", status: 403, message: "Forbidden", expose: false }));
    return;
  }
  next();
}
