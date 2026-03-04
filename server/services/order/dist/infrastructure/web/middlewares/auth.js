import jwt from "jsonwebtoken";
function getJwtSecret() {
    return process.env.JWT_SECRET || "dev-secret";
}
export function isAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    const token = (typeof authHeader === "string" ? authHeader : "")?.split(" ")?.[1]?.trim();
    if (!token) {
        console.warn("[Order auth] 401: no token on", req.method, req.path);
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = { id: String(decoded.id), role: decoded.role };
        next();
    }
    catch (err) {
        console.warn("[Order auth] 401: invalid or expired token", err.message);
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
export function isRestaurantOwner(_req, _res, next) {
    next();
}
