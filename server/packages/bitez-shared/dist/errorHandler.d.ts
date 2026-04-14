import type { Request, Response, NextFunction } from "express";
import type { Logger } from "pino";
export declare function createErrorHandler(logger: Logger): (err: unknown, req: Request, res: Response, _next: NextFunction) => void;
