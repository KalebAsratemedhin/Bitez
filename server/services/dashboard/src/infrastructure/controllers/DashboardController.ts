import type { Response, NextFunction } from "express";
import type { DashboardUseCase } from "../../application/usecases/DashboardUseCase.js";
import type { AuthenticatedRequest } from "../web/middlewares/auth.js";

export class DashboardController {
  constructor(private readonly dashboardUseCase: DashboardUseCase) {}

  getCustomerDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.dashboardUseCase.getCustomerDashboard({ customerId: userId });
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  getRestaurantOwnerDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.dashboardUseCase.getRestaurantOwnerDashboard({ ownerId: userId });
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  getDeliveryPersonDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.dashboardUseCase.getDeliveryPersonDashboard(userId);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };
}
