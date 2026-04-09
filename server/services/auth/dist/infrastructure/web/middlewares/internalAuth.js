import { AppError } from "../../http/errors.js";
/**
 * Server-to-server routes must send header X-Internal-Token matching INTERNAL_SERVICE_TOKEN.
 * In production, INTERNAL_SERVICE_TOKEN must be set. In development, if unset, checks are skipped.
 */
export function requireInternalServiceToken(req, _res, next) {
    const expected = process.env.INTERNAL_SERVICE_TOKEN?.trim();
    if (!expected) {
        if (process.env.NODE_ENV === "production") {
            next(new AppError({
                code: "INTERNAL",
                status: 503,
                message: "Service misconfigured",
                expose: false,
            }));
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
