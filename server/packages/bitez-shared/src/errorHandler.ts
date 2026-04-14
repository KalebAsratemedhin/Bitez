import type { Request, Response, NextFunction } from "express";
import type { Logger } from "pino";
import { asAppError } from "./errors.js";
import type { ContextRequest } from "./requestContext.js";

function getRequestId(req: Request): string | undefined {
  return (req as ContextRequest).context?.requestId;
}

export function createErrorHandler(logger: Logger) {
  return function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    const appErr = asAppError(err);
    const requestId = getRequestId(req);

    logger.error(
      {
        requestId,
        err,
        appError: {
          code: appErr.code,
          status: appErr.status,
          expose: appErr.expose,
          details: appErr.details,
        },
        http: {
          method: req.method,
          path: req.path,
        },
      },
      "request failed",
    );

    const message = appErr.expose ? appErr.message : "Internal server error";
    res.status(appErr.status).json({
      error: {
        code: appErr.code,
        message,
        requestId,
      },
    });
  };
}
