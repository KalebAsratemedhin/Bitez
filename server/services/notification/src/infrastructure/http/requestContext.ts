import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface RequestContext {
  requestId: string;
}

export interface ContextRequest extends Request {
  context?: RequestContext;
}

function newRequestId(): string {
  return `req_${crypto.randomBytes(12).toString("hex")}`;
}

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existing = req.header("x-request-id");
  const requestId = existing && existing.trim() ? existing.trim() : newRequestId();
  (req as ContextRequest).context = { requestId };
  res.setHeader("X-Request-Id", requestId);
  next();
}

