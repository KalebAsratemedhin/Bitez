import type { Request, Response, NextFunction } from "express";

import type { AuthUseCase } from "../../application/usecases/AuthUseCase.js";
import type { AuthenticatedRequest } from "../web/middlewares/auth.js";
import { AppError } from "../http/errors.js";

export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authUseCase.signup(req.body);
      res.status(201).json(result);
    } catch (e) {
      const message = (e as Error).message ?? "Invalid request";
      next(new AppError({ code: "BAD_REQUEST", status: 400, message, expose: true, cause: e }));
    }
  };

  signin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authUseCase.signin(req.body);
      res.json(result);
    } catch (e) {
      const message = (e as Error).message ?? "Invalid credentials";
      next(new AppError({ code: "UNAUTHORIZED", status: 401, message, expose: true, cause: e }));
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const h = req.headers.authorization ?? (req.headers as Record<string, string>).Authorization;
      const token = (typeof h === "string" ? h : "")?.split(" ")?.[1]?.trim();
      if (!token) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "No token provided", expose: true }));
        return;
      }
      const result = await this.authUseCase.logout({ token });
      res.json(result);
    } catch (e) {
      const message = (e as Error).message ?? "Invalid request";
      next(new AppError({ code: "BAD_REQUEST", status: 400, message, expose: true, cause: e }));
    }
  };

  getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authUseCase.getCurrentUser({ userId: req.user!.id });
      res.status(200).json(user);
    } catch (e) {
      const message = (e as Error).message ?? "Invalid request";
      next(new AppError({ code: "BAD_REQUEST", status: 400, message, expose: true, cause: e }));
    }
  };

  /** Internal: get minimal user by id for service-to-service (e.g. order/delivery enrichment). */
  getInternalUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "User id required", expose: true }));
        return;
      }
      const user = await this.authUseCase.getInternalUserById(id);
      if (!user) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: "User not found", expose: true }));
        return;
      }
      res.status(200).json(user);
    } catch (e) {
      next(e);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
      if (message === "User not found") {
        next(new AppError({ code: "NOT_FOUND", status: 404, message, expose: true, cause: e }));
        return;
      }
      if (message === "Email already in use") {
        next(new AppError({ code: "CONFLICT", status: 409, message, expose: true, cause: e }));
        return;
      }
      next(new AppError({ code: "BAD_REQUEST", status: 400, message: message ?? "Invalid request", expose: true, cause: e }));
    }
  };
}
