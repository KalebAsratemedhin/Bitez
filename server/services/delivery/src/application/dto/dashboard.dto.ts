export interface DeliveryPersonDashboardResult {
  totalDeliveries: number;
  deliveryData: { name: string; value: number }[];
  recentDeliveries: { id: string; order: string; status: string; time: string }[];
}
