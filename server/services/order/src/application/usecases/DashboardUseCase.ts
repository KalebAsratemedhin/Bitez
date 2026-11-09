import type { IOrderRepository } from "../../domain/interfaces/OrderRepository.js";
import type { IRestaurantReadModelRepository } from "../../domain/interfaces/RestaurantReadModelRepository.js";
import type {
  CustomerDashboardResult,
} from "../dto/dashboard.dto.js";

type OrderDoc = {
  _id?: unknown;
  customerID?: unknown;
  restaurantID?: unknown;
  totalAmount?: number;
  status?: string;
  createdAt?: Date;
};

function restaurantIdOf(o: OrderDoc): string {
  return String(o.restaurantID ?? "");
}

export class DashboardUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly restaurantReadModelRepository: IRestaurantReadModelRepository,
  ) {}

  async getCustomerDashboard(customerId: string): Promise<CustomerDashboardResult> {
    const orders = (await this.orderRepository.findOrdersByCustomerId(customerId)) as OrderDoc[];
    const restaurantIds = [...new Set(orders.map(restaurantIdOf))].filter(Boolean);
    const nameMap = new Map<string, string>();
    await Promise.all(
      restaurantIds.map(async (id) => {
        const r = await this.restaurantReadModelRepository.findById(id);
        nameMap.set(id, r?.name ?? "Unknown");
      }),
    );
    const getRestaurantName = (o: OrderDoc) => nameMap.get(restaurantIdOf(o)) ?? "Unknown";

    const now = new Date();
    const monthlySpending: { month: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const total = orders
        .filter((o) => {
          const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
          return t >= d.getTime() && t < next.getTime();
        })
        .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
      monthlySpending.push({
        month: d.toLocaleString("default", { month: "short", year: "2-digit" }),
        amount: total,
      });
    }

    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      const s = o.status ?? "unknown";
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    });
    const orderStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const restaurantOrderCount: Record<string, number> = {};
    orders.forEach((o) => {
      const name = getRestaurantName(o);
      restaurantOrderCount[name] = (restaurantOrderCount[name] ?? 0) + 1;
    });
    const favoriteRestaurants = Object.entries(restaurantOrderCount)
      .map(([name, ordersCount]) => ({ name, orders: ordersCount }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    const recentOrders = orders.slice(0, 10).map((o) => ({
      id: String(o._id ?? ""),
      restaurant: getRestaurantName(o),
      status: o.status ?? "",
      time: o.createdAt ? new Date(o.createdAt).toISOString() : "",
    }));

    return {
      monthlySpending,
      orderStatusDistribution,
      favoriteRestaurants,
      stats: {
        totalOrders: orders.length,
        totalSpent,
        restaurantsOrderedFrom: restaurantIds.length,
      },
      recentOrders,
    };
  }

}
