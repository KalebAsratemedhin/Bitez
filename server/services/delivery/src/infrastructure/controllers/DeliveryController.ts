import type { Request, Response, NextFunction } from "express";
import type { DeliveryUseCase } from "../../application/usecases/DeliveryUseCase.js";
import type { AuthenticatedRequest } from "../web/middlewares/auth.js";
import { AppError } from "../http/errors.js";

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
  if (message?.includes("available")) return 503;
  return 500;
}

export class DeliveryController {
  constructor(private readonly deliveryUseCase: DeliveryUseCase) {}

  createDeliveryPerson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.body?.userId;
      if (!userId) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "userId required", expose: true }));
        return;
      }
      const person = await this.deliveryUseCase.createDeliveryPerson({ userId: String(userId) });
      res.status(201).json({ success: true, deliveryPerson: person });
    } catch (e) {
      next(e);
    }
  };

  updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
      const status = deliveryErrorStatus(message);
      const code =
        status === 401 ? "UNAUTHORIZED"
        : status === 403 ? "FORBIDDEN"
        : status === 404 ? "NOT_FOUND"
        : status === 400 ? "BAD_REQUEST"
        : status === 503 ? "UPSTREAM_UNAVAILABLE"
        : "INTERNAL";
      next(new AppError({ code, status, message: status >= 500 ? "Internal server error" : message, expose: status < 500, cause: e }));
    }
  };

  getAllDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { deliveries, total } = await this.deliveryUseCase.getAllDeliveries(page, limit);
      res.json({
        success: true,
        data: deliveries,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      next(e);
    }
  };

  getCustomerDeliveries = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
      next(e);
    }
  };

  getDeliveryPersonDeliveries = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { deliveries, total, deliveryPerson } =
        await this.deliveryUseCase.getDeliveriesByDeliveryPersonUserId(
          getUserId(req),
          page,
          limit,
        );
      res.status(200).json({
        success: true,
        data: deliveries,
        pagination: paginationMeta(total, page, limit),
        ...(deliveryPerson && { deliveryPerson }),
      });
    } catch (e) {
      next(e);
    }
  };

  hasDeliveredToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deliveryPersonId = String(req.params.id ?? "").split(",")[0];
      const userId = String(req.params.userId ?? "").split(",")[0];
      if (!deliveryPersonId || !userId) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "deliveryPersonId and userId required", expose: true }));
        return;
      }
      const delivered = await this.deliveryUseCase.hasDeliveredToCustomer(
        deliveryPersonId,
        userId,
      );
      res.json({ delivered });
    } catch (e) {
      next(e);
    }
  };

  getDeliveryPersonByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.userId ?? "").split(",")[0];
      if (!userId) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message: "userId required", expose: true }));
        return;
      }
      const person = await this.deliveryUseCase.getDeliveryPersonByUserId(userId);
      if (!person) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: "Delivery person not found", expose: true }));
        return;
      }
      res.status(200).json(person);
    } catch (e) {
      next(e);
    }
  };

  getDeliveryPersonDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.deliveryUseCase.getDeliveryPersonDashboard(getUserId(req));
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  };
}
