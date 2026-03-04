function getOrderRestaurantId(o) {
    const r = o;
    return String(r.restaurantId ?? "");
}
export class DashboardUseCase {
    readModels;
    constructor(readModels) {
        this.readModels = readModels;
    }
    async getCustomerDashboard(input) {
        const orders = await this.readModels.findOrdersByCustomerId(input.customerId);
        const restaurantIds = [...new Set(orders.map((o) => getOrderRestaurantId(o)))].filter(Boolean);
        const nameMap = await this.readModels.getRestaurantNamesByIds(restaurantIds);
        const getRestaurantName = (o) => nameMap.get(getOrderRestaurantId(o)) ?? "Unknown";
        const now = new Date();
        const monthlySpending = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const total = orders
                .filter((o) => {
                const created = o.createdAt;
                const t = created ? new Date(created).getTime() : 0;
                return t >= d.getTime() && t < next.getTime();
            })
                .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
            monthlySpending.push({
                month: d.toLocaleString("default", { month: "short", year: "2-digit" }),
                amount: total,
            });
        }
        const statusCounts = {};
        orders.forEach((o) => {
            const s = o.status ?? "unknown";
            statusCounts[s] = (statusCounts[s] ?? 0) + 1;
        });
        const orderStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value,
        }));
        const restaurantOrderCount = {};
        orders.forEach((o) => {
            const name = getRestaurantName(o);
            restaurantOrderCount[name] = (restaurantOrderCount[name] ?? 0) + 1;
        });
        const favoriteRestaurants = Object.entries(restaurantOrderCount)
            .map(([name, ordersCount]) => ({ name, orders: ordersCount }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5);
        const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
        const recentOrders = orders.slice(0, 10).map((o) => {
            const r = o;
            return {
                id: String(r.orderId ?? ""),
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
                restaurantsOrderedFrom: restaurantIds.length,
            },
            recentOrders,
        };
    }
    async getRestaurantOwnerDashboard(input) {
        const myRestaurants = await this.readModels.findRestaurantsByOwnerId(input.ownerId);
        const restaurantIds = myRestaurants.map((r) => String(r.restaurantId ?? ""));
        const orders = await this.readModels.findOrdersByRestaurantIds(restaurantIds);
        const restNames = new Map();
        myRestaurants.forEach((r) => {
            if (r.restaurantId)
                restNames.set(r.restaurantId, r.name ?? "Unknown");
        });
        const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
        const totalOrders = orders.length;
        const restaurantCount = myRestaurants.length;
        const now = new Date();
        const salesOverTime = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const row = {
                date: d.toLocaleString("default", { month: "short", year: "2-digit" }),
            };
            myRestaurants.forEach((r) => {
                const rid = String(r.restaurantId ?? "");
                const name = r.name ?? "Unknown";
                const monthTotal = orders
                    .filter((o) => {
                    const oRest = o.restaurantId;
                    if (String(oRest) !== rid)
                        return false;
                    const created = o.createdAt;
                    const t = created ? new Date(created).getTime() : 0;
                    return t >= d.getTime() && t < next.getTime();
                })
                    .reduce((s, o) => s + (o.totalAmount ?? 0), 0);
                row[name] = monthTotal;
            });
            salesOverTime.push(row);
        }
        const salesShare = myRestaurants.map((r) => {
            const name = r.name ?? "Unknown";
            const rid = String(r.restaurantId ?? "");
            const total = orders
                .filter((o) => String(o.restaurantId) === rid)
                .reduce((s, o) => s + (o.totalAmount ?? 0), 0);
            return { name, value: total };
        });
        const ordersPerRestaurant = myRestaurants.map((r) => {
            const name = r.name ?? "Unknown";
            const rid = String(r.restaurantId ?? "");
            const count = orders.filter((o) => String(o.restaurantId) === rid).length;
            return { name, orders: count };
        });
        const customersPerRestaurant = myRestaurants.map((r) => {
            const name = r.name ?? "Unknown";
            const rid = String(r.restaurantId ?? "");
            const custIds = new Set(orders
                .filter((o) => String(o.restaurantId) === rid)
                .map((o) => String(o.customerId ?? "")));
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
    async getDeliveryPersonDashboard(userId) {
        const deliveries = await this.readModels.findDeliveriesByDeliveryPersonUserId(userId);
        const statusToDisplay = {
            delivered: "Completed",
            failed: "Cancelled",
            cancelled: "Cancelled",
        };
        const displayCounts = {
            Completed: 0,
            Cancelled: 0,
            "In Progress": 0,
        };
        deliveries.forEach((d) => {
            const s = d.status ?? "";
            const name = statusToDisplay[s.toLowerCase()] ?? "In Progress";
            displayCounts[name] = (displayCounts[name] ?? 0) + 1;
        });
        const deliveryData = [
            { name: "Completed", value: displayCounts.Completed },
            { name: "Cancelled", value: displayCounts.Cancelled },
            { name: "In Progress", value: displayCounts["In Progress"] },
        ];
        const recentDeliveries = deliveries.slice(0, 10).map((d) => {
            const x = d;
            return {
                id: String(x.deliveryId ?? ""),
                order: String(x.orderId ?? ""),
                status: statusToDisplay[(x.status ?? "").toLowerCase()] ?? x.status ?? "In Progress",
                time: x.createdAt ? new Date(x.createdAt).toISOString() : "",
            };
        });
        return {
            totalDeliveries: deliveries.length,
            deliveryData,
            recentDeliveries,
        };
    }
}
