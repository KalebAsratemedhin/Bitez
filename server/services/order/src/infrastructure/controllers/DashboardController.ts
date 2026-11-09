import type { Response, NextFunction } from "express";
import type { DashboardUseCase } from "../../application/usecases/DashboardUseCase.js";
import type { AuthenticatedRequest } from "@bitez/shared";

export class DashboardController {
  constructor(private readonly dashboardUseCase: DashboardUseCase) {}

  getCustomerDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.dashboardUseCase.getCustomerDashboard(req.user!.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

}
