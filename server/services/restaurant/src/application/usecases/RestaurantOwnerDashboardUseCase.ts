import type { IRestaurantRepository } from "../../domain/interfaces/index.js";
import OrderSalesReadModel from "../../infrastructure/persistence/models/orderSalesReadModel.js";

export interface RestaurantOwnerDashboardResult {
  totalSales: number;
  totalOrders: number;
  restaurantCount: number;
  salesOverTime: { date: string; [k: string]: string | number }[];
  salesShare: { name: string; value: number }[];
  ordersPerRestaurant: { name: string; orders: number }[];
  customersPerRestaurant: { name: string; customers: number }[];
}

type OrderDoc = {
  customerId?: string;
  restaurantId?: string;
  totalAmount?: number;
  createdAt?: Date;
};

export class RestaurantOwnerDashboardUseCase {
  constructor(private readonly restaurantRepository: IRestaurantRepository) {}

  async get(ownerId: string): Promise<RestaurantOwnerDashboardResult> {
    const { restaurants } = await this.restaurantRepository.findByOwnerId(ownerId, 1, 1000);
    const restaurantIds = restaurants.map((r) => String(r._id));
    const orders = (await OrderSalesReadModel.find({
      restaurantId: { $in: restaurantIds },
    }).lean()) as OrderDoc[];

    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    const now = new Date();
    const salesOverTime: { date: string; [k: string]: string | number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const row: { date: string; [k: string]: string | number } = {
        date: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      };
      restaurants.forEach((r) => {
        const rid = String(r._id);
        row[r.name] = orders
          .filter((o) => {
            if (String(o.restaurantId) !== rid) return false;
            const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            return t >= d.getTime() && t < next.getTime();
          })
          .reduce((s, o) => s + (o.totalAmount ?? 0), 0);
      });
      salesOverTime.push(row);
    }

    return {
      totalSales,
      totalOrders: orders.length,
      restaurantCount: restaurants.length,
      salesOverTime,
      salesShare: restaurants.map((r) => ({
        name: r.name,
        value: orders
          .filter((o) => String(o.restaurantId) === String(r._id))
          .reduce((s, o) => s + (o.totalAmount ?? 0), 0),
      })),
      ordersPerRestaurant: restaurants.map((r) => ({
        name: r.name,
        orders: orders.filter((o) => String(o.restaurantId) === String(r._id)).length,
      })),
      customersPerRestaurant: restaurants.map((r) => ({
        name: r.name,
        customers: new Set(
          orders
            .filter((o) => String(o.restaurantId) === String(r._id))
            .map((o) => String(o.customerId ?? "")),
        ).size,
      })),
    };
  }
}
