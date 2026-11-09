import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny, output } from "zod";
import { AppError } from "./errors.js";

export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError({
      code: "BAD_REQUEST",
      status: 400,
      message: "Validation failed",
      expose: true,
      details: { issues: result.error.issues },
    });
  }
  return result.data;
}

export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = parseBody(schema, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
