import type { Request, Response, NextFunction } from "express";
export interface RequestContext {
    requestId: string;
}
export interface ContextRequest extends Request {
    context?: RequestContext;
}
export declare function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void;
