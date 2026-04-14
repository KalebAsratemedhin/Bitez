import type { Request, Response, NextFunction } from "express";
import type { OrderUseCase } from "../../application/usecases/OrderUseCase.js";
import type { AuthenticatedRequest } from "../web/middlewares/auth.js";
import { AppError } from "@bitez/shared";

function getUserId(req: AuthenticatedRequest): string {
  return req.user!.id;
}

function getUserRole(req: AuthenticatedRequest): string | undefined {
  return req.user?.role;
}

function getAuthHeader(req: Request): string | undefined {
  const h = req.headers.authorization ?? (req.headers as Record<string, string>).Authorization;
  return typeof h === "string" ? h : undefined;
}

function parsePageLimit(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit), 10) || 10));
  return { page, limit };
}

function paginationMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

function orderErrorStatus(message: string): number {
  if (message?.includes("authorized") || message?.includes("cancelled")) return 401;
  if (message?.includes("Invalid") || message?.includes("not active")) return 400;
  if (message?.includes("not found")) return 404;
  return 500;
}

export class OrderController {
  constructor(private readonly orderUseCase: OrderUseCase) {}

  createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCase.createOrder({
        ...req.body,
        customerID: getUserId(req),
      });
      res.status(201).json({ success: true, message: "Order created successfully.", order });
    } catch (e) {
      const message = (e as Error).message ?? "";
      if (message.includes("not active")) {
        next(new AppError({ code: "BAD_REQUEST", status: 400, message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };

  updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const order = await this.orderUseCase.updateOrderStatus({
        orderId: id,
        status: req.body.status,
        userId: getUserId(req),
      });
      res.status(200).json({ success: true, order });
    } catch (e) {
      const message = (e as Error).message ?? "";
      const status = orderErrorStatus(message);
      const code =
        status === 400 ? "BAD_REQUEST"
        : status === 401 ? "UNAUTHORIZED"
        : status === 403 ? "FORBIDDEN"
        : status === 404 ? "NOT_FOUND"
        : "INTERNAL";
      next(new AppError({ code, status, message: status >= 500 ? "Internal server error" : message, expose: status < 500, cause: e }));
    }
  };

  cancelOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const order = await this.orderUseCase.cancelOrder({
        orderId: id,
        userId: getUserId(req),
      });
      res.status(200).json({ success: true, order });
    } catch (e) {
      const message = (e as Error).message ?? "";
      const status =
        message.includes("authorized") ? 401
        : message.includes("already") || message.includes("cannot") ? 400
        : message.includes("not found") ? 404
        : 500;
      const code = status === 400 ? "BAD_REQUEST" : status === 401 ? "UNAUTHORIZED" : status === 404 ? "NOT_FOUND" : "INTERNAL";
      next(new AppError({ code, status, message: status >= 500 ? "Internal server error" : message, expose: status < 500, cause: e }));
    }
  };

  getAllOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { orders, total } = await this.orderUseCase.getAllOrdersForAdmin(
        getUserRole(req),
        page,
        limit,
      );
      res.json({
        success: true,
        data: orders,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      const message = (e as Error).message ?? "";
      if (message.includes("not authorized")) {
        next(new AppError({ code: "FORBIDDEN", status: 403, message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };

  getCustomerOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { orders, total } = await this.orderUseCase.getOrdersByCustomerId(
        getUserId(req),
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        data: orders,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      next(e);
    }
  };

  getRestaurantOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const id = String(req.params.id ?? "").split(",")[0];
      const { orders, total } = await this.orderUseCase.getOrdersByRestaurantIdForRequester(
        id,
        getUserId(req),
        getUserRole(req),
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        data: orders,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      const message = (e as Error).message ?? "";
      if (message.includes("not authorized")) {
        next(new AppError({ code: "FORBIDDEN", status: 403, message, expose: true, cause: e }));
        return;
      }
      if (message.includes("not found")) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };

  getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const order = await this.orderUseCase.getOrderByIdForRequester(
        id,
        getUserId(req),
        getUserRole(req),
      );
      if (!order) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: "Order not found", expose: true }));
        return;
      }
      res.status(200).json({ success: true, order });
    } catch (e) {
      const message = (e as Error).message ?? "";
      if (message.includes("not authorized")) {
        next(new AppError({ code: "FORBIDDEN", status: 403, message, expose: true, cause: e }));
        return;
      }
      next(e);
    }
  };

  /** Internal: enriched order (restaurant + customer) for delivery service. */
  getInternalOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const order = await this.orderUseCase.getOrderByIdEnriched(id);
      if (!order) {
        next(new AppError({ code: "NOT_FOUND", status: 404, message: "Order not found", expose: true }));
        return;
      }
      res.status(200).json(order);
    } catch (e) {
      next(e);
    }
  };

  payForOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!process.env.SERVER_URL) {
        next(new AppError({ code: "INTERNAL", status: 500, message: "SERVER_URL not configured", expose: false }));
        return;
      }
      const result = await this.orderUseCase.initializePayment({
        orderId: req.body.orderId,
        total: req.body.total,
        userId: getUserId(req),
        serverUrl: process.env.SERVER_URL,
        authHeader: getAuthHeader(req),
      });
      res.status(201).json({ message: result.message, url: result.checkoutUrl });
    } catch (e) {
      next(e);
    }
  };

  paymentSuccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
      const { orderId } = await this.orderUseCase.paymentSuccessCallback({
        token: String(token ?? ""),
      });
      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      res.redirect(`${clientUrl}/order-confirmation/${orderId}`);
    } catch (e) {
      next(e);
    }
  };
}
