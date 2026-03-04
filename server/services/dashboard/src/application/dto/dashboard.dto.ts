export interface CustomerDashboardInput {
  customerId: string;
}

export interface CustomerDashboardResult {
  monthlySpending: { month: string; amount: number }[];
  orderStatusDistribution: { name: string; value: number }[];
  favoriteRestaurants: { name: string; orders: number }[];
  stats: { totalOrders: number; totalSpent: number; restaurantsOrderedFrom: number };
  recentOrders: { id: string; restaurant: string; status: string; time: string }[];
}

export interface RestaurantOwnerDashboardInput {
  ownerId: string;
}

export interface RestaurantOwnerDashboardResult {
  totalSales: number;
  totalOrders: number;
  restaurantCount: number;
  salesOverTime: { date: string; [k: string]: string | number }[];
  salesShare: { name: string; value: number }[];
  ordersPerRestaurant: { name: string; orders: number }[];
  customersPerRestaurant: { name: string; customers: number }[];
}

export interface DeliveryPersonDashboardResult {
  totalDeliveries: number;
  deliveryData: { name: string; value: number }[];
  recentDeliveries: { id: string; order: string; status: string; time: string }[];
}
