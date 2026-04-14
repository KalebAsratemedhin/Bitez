import { asAppError } from "./errors.js";
function getRequestId(req) {
    return req.context?.requestId;
}
export function createErrorHandler(logger) {
    return function errorHandler(err, req, res, _next) {
        const appErr = asAppError(err);
        const requestId = getRequestId(req);
        logger.error({
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
        }, "request failed");
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
