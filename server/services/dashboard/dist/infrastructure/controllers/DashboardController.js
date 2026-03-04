export class DashboardController {
    dashboardUseCase;
    constructor(dashboardUseCase) {
        this.dashboardUseCase = dashboardUseCase;
    }
    getCustomerDashboard = async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await this.dashboardUseCase.getCustomerDashboard({ customerId: userId });
            res.json(result);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    getRestaurantOwnerDashboard = async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await this.dashboardUseCase.getRestaurantOwnerDashboard({ ownerId: userId });
            res.json(result);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    getDeliveryPersonDashboard = async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await this.dashboardUseCase.getDeliveryPersonDashboard(userId);
            res.json(result);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
}
