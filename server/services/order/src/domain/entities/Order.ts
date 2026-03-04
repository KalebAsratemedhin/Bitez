export const OrderStatus = {
  UNPAID: "unpaid",
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export function orderCanBeCancelled(status: string): boolean {
  return status === OrderStatus.UNPAID || status === OrderStatus.PENDING;
}

export function orderIsCancelled(status: string): boolean {
  return status === OrderStatus.CANCELLED;
}
