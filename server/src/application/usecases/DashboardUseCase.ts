import type { IOrderRepository, IRestaurantRepository } from "@domain/interfaces/index.js";
import type {
  CustomerDashboardInput,
  CustomerDashboardResult,
  RestaurantOwnerDashboardInput,
  RestaurantOwnerDashboardResult,
} from "@application/dto/dashboard.dto.js";

export interface DashboardUseCaseDeps {
  orderRepository: IOrderRepository;
  restaurantRepository: IRestaurantRepository;
}

function getRestaurantName(o: unknown): string {
  const r = o as { restaurantID?: { name?: string } | string };
  if (typeof r.restaurantID === "object" && r.restaurantID?.name) return r.restaurantID.name;
  return "Unknown";
}

function getOrderRestaurantId(o: unknown): string {
  const r = o as { restaurantID?: { _id?: unknown } | unknown };
  const oRest = r.restaurantID;
  if (oRest && typeof oRest === "object" && "_id" in oRest) return String((oRest as { _id: unknown })._id);
  return String(oRest);
}

export class DashboardUseCase {
  constructor(private readonly deps: DashboardUseCaseDeps) {}

  async getCustomerDashboard(input: CustomerDashboardInput): Promise<CustomerDashboardResult> {
    const orders = await this.deps.orderRepository.findOrdersByCustomerId(input.customerId);
    const now = new Date();
    const monthlySpending: { month: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const total = orders
        .filter((o) => {
          const created = (o as { createdAt?: Date }).createdAt;
          const t = created ? new Date(created).getTime() : 0;
          return t >= d.getTime() && t < next.getTime();
        })
        .reduce((sum: number, o) => sum + ((o as { totalAmount?: number }).totalAmount ?? 0), 0);
      monthlySpending.push({
        month: d.toLocaleString("default", { month: "short", year: "2-digit" }),
        amount: total,
      });
    }
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      const s = (o as { status?: string }).status ?? "unknown";
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    });
    const orderStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const restaurantOrderCount: Record<string, number> = {};
    orders.forEach((o) => {
      const name = getRestaurantName(o);
      restaurantOrderCount[name] = (restaurantOrderCount[name] ?? 0) + 1;
    });
    const favoriteRestaurants = Object.entries(restaurantOrderCount)
      .map(([name, ordersCount]) => ({ name, orders: ordersCount }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
    const totalSpent = orders.reduce((sum: number, o) => sum + ((o as { totalAmount?: number }).totalAmount ?? 0), 0);
    const restaurantIds = new Set(orders.map((o) => getOrderRestaurantId(o)));
    const recentOrders = orders.slice(0, 10).map((o) => {
      const r = o as { _id?: unknown; status?: string; createdAt?: Date };
      return {
        id: String(r._id ?? ""),
        restaurant: getRestaurantName(o),
        status: r.status ?? "",
        time: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      };
    });
    return {
      monthlySpending,
      orderStatusDistribution,
      favoriteRestaurants,
      stats: {
        totalOrders: orders.length,
        totalSpent,
        restaurantsOrderedFrom: restaurantIds.size,
      },
      recentOrders,
    };
  }

  async getRestaurantOwnerDashboard(
    input: RestaurantOwnerDashboardInput
  ): Promise<RestaurantOwnerDashboardResult> {
    const { restaurants: myRestaurants, total: _total } =
      await this.deps.restaurantRepository.findByOwnerId(input.ownerId, 1, 1000);
    const restaurantIds = (myRestaurants as unknown[]).map(
      (r) => String((r as { _id?: unknown })._id)
    );
    const orders = await this.deps.orderRepository.findOrdersByRestaurantIds(restaurantIds);
    const restNames = new Map<string, string>();
    (myRestaurants as unknown[]).forEach((r) => {
      const x = r as { _id?: unknown; name?: string };
      restNames.set(String(x._id), x.name ?? "Unknown");
    });
    const totalSales = orders.reduce(
      (sum: number, o) => sum + ((o as { totalAmount?: number }).totalAmount ?? 0),
      0
    );
    const totalOrders = orders.length;
    const restaurantCount = myRestaurants.length;
    const now = new Date();
    const salesOverTime: { date: string; [k: string]: string | number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const row: { date: string; [k: string]: string | number } = {
        date: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      };
      (myRestaurants as unknown[]).forEach((r) => {
        const rid = (r as { _id?: unknown })._id;
        const name = (r as { name?: string }).name ?? "Unknown";
        const monthTotal = orders
          .filter((o) => {
            const oRest = (o as { restaurantID?: unknown }).restaurantID;
            const id =
              typeof oRest === "object" && oRest !== null && "_id" in oRest
                ? String((oRest as { _id: unknown })._id)
                : String(oRest);
            if (id !== String(rid)) return false;
            const created = (o as { createdAt?: Date }).createdAt;
            const t = created ? new Date(created).getTime() : 0;
            return t >= d.getTime() && t < next.getTime();
          })
          .reduce((s: number, o) => s + ((o as { totalAmount?: number }).totalAmount ?? 0), 0);
        row[name] = monthTotal;
      });
      salesOverTime.push(row);
    }
    const salesShare = (myRestaurants as unknown[]).map((r) => {
      const name = (r as { name?: string }).name ?? "Unknown";
      const rid = (r as { _id?: unknown })._id;
      const total = orders
        .filter((o) => {
          const oRest = (o as { restaurantID?: unknown }).restaurantID;
          const id =
            typeof oRest === "object" && oRest !== null && "_id" in oRest
              ? String((oRest as { _id: unknown })._id)
              : String(oRest);
          return id === String(rid);
        })
        .reduce((s: number, o) => s + ((o as { totalAmount?: number }).totalAmount ?? 0), 0);
      return { name, value: total };
    });
    const ordersPerRestaurant = (myRestaurants as unknown[]).map((r) => {
      const name = (r as { name?: string }).name ?? "Unknown";
      const rid = (r as { _id?: unknown })._id;
      const count = orders.filter((o) => {
        const oRest = (o as { restaurantID?: unknown }).restaurantID;
        const id =
          typeof oRest === "object" && oRest !== null && "_id" in oRest
            ? String((oRest as { _id: unknown })._id)
            : String(oRest);
        return id === String(rid);
      }).length;
      return { name, orders: count };
    });
    const customersPerRestaurant = (myRestaurants as unknown[]).map((r) => {
      const name = (r as { name?: string }).name ?? "Unknown";
      const rid = (r as { _id?: unknown })._id;
      const custIds = new Set(
        orders
          .filter((o) => {
            const oRest = (o as { restaurantID?: unknown }).restaurantID;
            const id =
              typeof oRest === "object" && oRest !== null && "_id" in oRest
                ? String((oRest as { _id: unknown })._id)
                : String(oRest);
            return id === String(rid);
          })
          .map((o) => String((o as { customerID?: unknown }).customerID))
      );
      return { name, customers: custIds.size };
    });
    return {
      totalSales,
      totalOrders,
      restaurantCount,
      salesOverTime,
      salesShare,
      ordersPerRestaurant,
      customersPerRestaurant,
    };
  }
}
