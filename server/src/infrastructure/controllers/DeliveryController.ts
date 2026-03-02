import type { Request, Response } from "express";

import type { DeliveryUseCase } from "@application/usecases/DeliveryUseCase.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

function getUserId(req: AuthenticatedRequest): string {
  return req.user!.id;
}

function parsePageLimit(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit), 10) || 10));
  return { page, limit };
}

function paginationMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

function deliveryErrorStatus(message: string): number {
  if (message?.includes("authorized")) return 401;
  if (message?.includes("not found")) return 404;
  return 500;
}

export class DeliveryController {
  constructor(private readonly deliveryUseCase: DeliveryUseCase) {}

  updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const delivery = await this.deliveryUseCase.updateDeliveryStatus({
        deliveryId: id,
        status: req.body.status,
        userId: getUserId(req),
      });
      res.status(200).json({ success: true, delivery });
    } catch (e) {
      const message = (e as Error).message;
      res.status(deliveryErrorStatus(message)).json({ success: false, message });
    }
  };

  getAllDeliveries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { deliveries, total } = await this.deliveryUseCase.getAllDeliveries(page, limit);
      res.json({
        success: true,
        data: deliveries,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };

  getCustomerDeliveries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { deliveries, total } = await this.deliveryUseCase.getDeliveriesByCustomerId(
        getUserId(req),
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        data: deliveries,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };

  getDeliveryPersonDeliveries = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { deliveries, total } =
        await this.deliveryUseCase.getDeliveriesByDeliveryPersonUserId(
          getUserId(req),
          page,
          limit,
        );
      res.status(200).json({
        success: true,
        data: deliveries,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };
}
