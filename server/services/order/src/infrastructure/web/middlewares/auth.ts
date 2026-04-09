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
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role?: string };
    (req as AuthenticatedRequest).user = { id: String(decoded.id), role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function normalizeRole(role: string | undefined): string {
  return role ? String(role) : "";
}

export function isRestaurantOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const r = normalizeRole((req as AuthenticatedRequest).user?.role);
  if (r !== "restaurant_owner") {
    res.status(403).json({ error: "Restaurant owner access required" });
    return;
  }
  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (normalizeRole((req as AuthenticatedRequest).user?.role) !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
