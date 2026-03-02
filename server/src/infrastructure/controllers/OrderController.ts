import type { Request, Response } from "express";

import type { OrderUseCase } from "@application/usecases/OrderUseCase.js";

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

function orderErrorStatus(message: string): number {
  if (message?.includes("authorized") || message?.includes("cancelled")) return 401;
  if (message?.includes("Invalid") || message?.includes("not active")) return 400;
  if (message?.includes("not found")) return 404;
  return 500;
}

export class OrderController {
  constructor(private readonly orderUseCase: OrderUseCase) {}

  createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const order = await this.orderUseCase.createOrder({
        ...req.body,
        customerID: getUserId(req),
      });
      res.status(201).json({ success: true, message: "Order created successfully.", order });
    } catch (e) {
      const message = (e as Error).message;
      const status = message?.includes("not active") ? 400 : 500;
      res.status(status).json({ success: false, message });
    }
  };

  updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const order = await this.orderUseCase.updateOrderStatus({
        orderId: id,
        status: req.body.status,
        userId: getUserId(req),
      });
      res.status(200).json({ success: true, order });
    } catch (e) {
      const message = (e as Error).message;
      res.status(orderErrorStatus(message)).json({ success: false, message });
    }
  };

  cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const order = await this.orderUseCase.cancelOrder({
        orderId: id,
        userId: getUserId(req),
      });
      res.status(200).json({ success: true, order });
    } catch (e) {
      const message = (e as Error).message;
      const status =
        message?.includes("authorized") ? 401
        : message?.includes("already") || message?.includes("cannot") ? 400
        : message?.includes("not found") ? 404
        : 500;
      res.status(status).json({ success: false, message });
    }
  };

  getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const { orders, total } = await this.orderUseCase.getAllOrders(page, limit);
      res.json({
        success: true,
        data: orders,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };

  getCustomerOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };

  getRestaurantOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { page, limit } = parsePageLimit(req);
      const id = String(req.params.id ?? "").split(",")[0];
      const { orders, total } = await this.orderUseCase.getOrdersByRestaurantId(
        id,
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        data: orders,
        pagination: paginationMeta(total, page, limit),
      });
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };

  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id ?? "").split(",")[0];
      const order = await this.orderUseCase.getOrderById(id);
      if (!order) {
        res.status(404).json({ success: false, message: "Order not found" });
        return;
      }
      res.status(200).json({ success: true, order });
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };

  payForOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.orderUseCase.initializePayment({
        orderId: req.body.orderId,
        total: req.body.total,
        userId: getUserId(req),
        serverUrl: process.env.SERVER_URL!,
      });
      res.status(201).json({ message: result.message, url: result.checkoutUrl });
    } catch (e) {
      res.status(500).json({ message: (e as Error).message });
    }
  };

  paymentSuccess = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
        const { orderId } = await this.orderUseCase.paymentSuccessCallback({
        token: String(token ?? ""),
      });
      res.redirect(`${process.env.CLIENT_URL}/order-confirmation/${orderId}`);
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  };
}
