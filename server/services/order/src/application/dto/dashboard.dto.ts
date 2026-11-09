export interface CustomerDashboardResult {
  monthlySpending: { month: string; amount: number }[];
  orderStatusDistribution: { name: string; value: number }[];
  favoriteRestaurants: { name: string; orders: number }[];
  stats: { totalOrders: number; totalSpent: number; restaurantsOrderedFrom: number };
  recentOrders: { id: string; restaurant: string; status: string; time: string }[];
}
