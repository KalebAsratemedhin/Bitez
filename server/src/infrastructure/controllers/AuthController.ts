import type { Request, Response } from "express";

import type { AuthUseCase } from "@application/usecases/AuthUseCase.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  signup = async (req: Request, res: Response): Promise<void> => {
    console.log("[Auth] signup request body keys:", Object.keys(req.body || {}));
    try {
      const result = await this.authUseCase.signup(req.body);
      res.status(201).json(result);
    } catch (e) {
      console.error("[Auth] signup error:", (e as Error).message);
      res.status(400).json({ error: (e as Error).message });
    }
  };

  signin = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authUseCase.signin(req.body);
      res.json(result);
    } catch (e) {
      res.status(401).json({ error: (e as Error).message });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const h = req.headers.authorization ?? (req.headers as Record<string, string>).Authorization;
      const token = (typeof h === "string" ? h : "")?.split(" ")?.[1]?.trim();
      if (!token) {
        res.status(400).json({ error: "No token provided" });
        return;
      }
      const result = await this.authUseCase.logout({ token });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  };

  getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await this.authUseCase.getCurrentUser({ userId: req.user!.id });
      res.status(200).json(user);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  };
}
