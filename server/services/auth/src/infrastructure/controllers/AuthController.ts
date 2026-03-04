import type { Request, Response } from "express";

import type { AuthUseCase } from "../../application/usecases/AuthUseCase.js";
import type { AuthenticatedRequest } from "../web/middlewares/auth.js";

export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authUseCase.signup(req.body);
      res.status(201).json(result);
    } catch (e) {
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

  /** Internal: get minimal user by id for service-to-service (e.g. order/delivery enrichment). */
  getInternalUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        res.status(400).json({ error: "User id required" });
        return;
      }
      const user = await this.authUseCase.getInternalUserById(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const body = req.body as { name?: string; email?: string; phoneNumber?: string; address?: string };
      const user = await this.authUseCase.updateProfile(userId, {
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
      });
      res.status(200).json(user);
    } catch (e) {
      const message = (e as Error).message;
      if (message === "User not found") res.status(404).json({ error: message });
      else if (message === "Email already in use") res.status(400).json({ error: message });
      else res.status(400).json({ error: message });
    }
  };
}
