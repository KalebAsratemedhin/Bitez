import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role?: string };
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "dev-secret";
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization ?? (req.headers as Record<string, string>).Authorization;
  const token = (typeof authHeader === "string" ? authHeader : "")?.split(" ")?.[1]?.trim();
  console.log("[Auth] isAuthenticated", { path: req.path, hasHeader: !!authHeader, tokenLength: token?.length ?? 0 });
  if (!token) {
    console.warn("[Auth] 401 – no token");
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role?: string };
    (req as AuthenticatedRequest).user = { id: String(decoded.id), role: decoded.role };
    console.log("[Auth] token OK", { path: req.path, userId: decoded.id });
    next();
  } catch (err) {
    console.error("[Auth] 401 – jwt.verify failed", { path: req.path, error: (err as Error).message });
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization ?? (req.headers as Record<string, string>).Authorization;
  const token = (typeof authHeader === "string" ? authHeader : "")?.split(" ")?.[1]?.trim();
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role?: string };
    (req as AuthenticatedRequest).user = { id: String(decoded.id), role: decoded.role };
    next();
  } catch {
    next();
  }
}

export function isAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if ((req as AuthenticatedRequest).user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function isDeliveryPerson(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if ((req as AuthenticatedRequest).user?.role !== "delivery_person") {
    res.status(403).json({ error: "Delivery person access required" });
    return;
  }
  next();
}

export function isRestaurantOwner(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next();
}
