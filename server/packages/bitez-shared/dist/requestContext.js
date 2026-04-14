import crypto from "crypto";
function newRequestId() {
    return `req_${crypto.randomBytes(12).toString("hex")}`;
}
export function requestContextMiddleware(req, res, next) {
    const existing = req.header("x-request-id");
    const requestId = existing && existing.trim() ? existing.trim() : newRequestId();
    req.context = { requestId };
    res.setHeader("X-Request-Id", requestId);
    next();
}
