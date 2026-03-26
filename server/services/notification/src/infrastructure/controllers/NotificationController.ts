import type { Request, Response, NextFunction } from "express";
import type { NotificationUseCase } from "../../application/usecases/NotificationUseCase.js";
import type { AuthenticatedRequest } from "../web/middlewares/auth.js";
import { AppError } from "../http/errors.js";

export class NotificationController {
  constructor(private readonly notificationUseCase: NotificationUseCase) {}

  notify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, message, type } = req.body;
      if (!userId || !message) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "userId and message required", expose: true }));
        return;
      }
      await this.notificationUseCase.create({
        userId: String(userId),
        message: String(message),
        type: type ? String(type) : undefined,
      });
      res.status(201).json({ success: true });
    } catch (e) {
      next(e);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const list = await this.notificationUseCase.listForUser({ userId });
      const out = (list as unknown[]).map((n) => {
        const x = n as { _id?: unknown; message?: string; createdAt?: Date; seen?: boolean };
        return {
          _id: x._id?.toString?.() ?? String(x._id),
          message: x.message ?? "",
          createdAt: x.createdAt ?? new Date(),
          seen: x.seen ?? false,
        };
      });
      res.json(out);
    } catch (e) {
      next(e);
    }
  };

  markAsSeen = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id ?? "").split(",")[0];
      const notification = await this.notificationUseCase.markAsSeen({
        notificationId: id,
        userId,
      });
      const x = notification as { _id?: unknown; message?: string; createdAt?: Date; seen?: boolean };
      res.json({
        _id: x._id?.toString?.() ?? String(x._id),
        message: x.message ?? "",
        createdAt: x.createdAt ?? new Date(),
        seen: true,
      });
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("not found")) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: err.message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };
}
