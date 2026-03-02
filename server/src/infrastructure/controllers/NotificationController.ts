import type { Request, Response } from "express";
import type { NotificationUseCase } from "@application/usecases/NotificationUseCase.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export class NotificationController {
  constructor(private readonly notificationUseCase: NotificationUseCase) {}

  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      res.status(500).json({ error: (e as Error).message });
    }
  };

  markAsSeen = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      if (err.message?.includes("not found")) res.status(404).json({ error: err.message });
      else res.status(500).json({ error: err.message });
    }
  };
}
