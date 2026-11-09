import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { resolveJwtSecret } from "./env.js";

export interface AuthUser {
  id: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export type TokenRevocationCheck = (token: string) => Promise<boolean>;

export interface JwtAuthConfig {
  getSecret?: () => string;
  /** Return true if the token must be rejected (e.g. logged out). */
  isTokenRevoked?: TokenRevocationCheck;
}

let getSecret: () => string = resolveJwtSecret;
let isTokenRevoked: TokenRevocationCheck | undefined;

export function configureJwtAuth(config: JwtAuthConfig = {}): void {
  if (config.getSecret) getSecret = config.getSecret;
  if (config.isTokenRevoked) isTokenRevoked = config.isTokenRevoked;
}

function extractBearerToken(req: Request): string | undefined {
  const authHeader =
    req.headers.authorization ?? (req.headers as Record<string, string | undefined>).Authorization;
  const raw = typeof authHeader === "string" ? authHeader : "";
  const token = raw.split(" ")[1]?.trim();
  return token || undefined;
}

function normalizeRole(role: string | undefined): string {
  return role ? String(role) : "";
}

async function attachUserFromToken(
  req: Request,
  token: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (isTokenRevoked && (await isTokenRevoked(token))) {
    return { ok: false, status: 401, error: "Token has been revoked" };
  }
  try {
    const decoded = jwt.verify(token, getSecret()) as { id: string; role?: string };
    (req as AuthenticatedRequest).user = { id: String(decoded.id), role: decoded.role };
    return { ok: true };
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  void attachUserFromToken(req, token).then((result) => {
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    next();
  });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }
  void attachUserFromToken(req, token).then((result) => {
    if (!result.ok) {
      // optional: ignore invalid/revoked tokens
      next();
      return;
    }
    next();
  });
}

export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = normalizeRole((req as AuthenticatedRequest).user?.role);
    if (!allowed.includes(role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const isAdmin = requireRole("admin");
export const isRestaurantOwner = requireRole("restaurant_owner");
export const isDeliveryPerson = requireRole("delivery_person");

/**
 * Check auth service blacklist over HTTP (for non-auth services).
 * Fails open on network/auth errors so a down auth service does not take down the mesh;
 * a 200 + revoked=true always rejects.
 */
export function createHttpTokenRevocationCheck(authServiceUrl: string): TokenRevocationCheck {
  const base = authServiceUrl.replace(/\/$/, "");
  return async (token: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const internal = process.env.INTERNAL_SERVICE_TOKEN?.trim();
      if (internal) headers["X-Internal-Token"] = internal;
      const res = await fetch(`${base}/internal/token/revoked`, {
        method: "POST",
        headers,
        body: JSON.stringify({ token }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { revoked?: boolean };
      return Boolean(data.revoked);
    } catch {
      return false;
    }
  };
}
