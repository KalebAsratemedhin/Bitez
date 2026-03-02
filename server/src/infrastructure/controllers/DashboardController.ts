import type { Request, Response } from "express";
import type { DashboardUseCase } from "@application/usecases/DashboardUseCase.js";
import type { DeliveryUseCase } from "@application/usecases/DeliveryUseCase.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export class DashboardController {
  constructor(
    private readonly dashboardUseCase: DashboardUseCase,
    private readonly deliveryUseCase: DeliveryUseCase,
  ) {}

  getCustomerDashboard = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.dashboardUseCase.getCustomerDashboard({ customerId: userId });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };

  getRestaurantOwnerDashboard = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.dashboardUseCase.getRestaurantOwnerDashboard({ ownerId: userId });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };

  getDeliveryPersonDashboard = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.deliveryUseCase.getDeliveryPersonDashboard(userId);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  };
}
