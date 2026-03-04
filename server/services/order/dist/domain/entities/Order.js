export const OrderStatus = {
    UNPAID: "unpaid",
    PENDING: "pending",
    PREPARING: "preparing",
    READY: "ready",
    CANCELLED: "cancelled",
};
export function orderCanBeCancelled(status) {
    return status === OrderStatus.UNPAID || status === OrderStatus.PENDING;
}
export function orderIsCancelled(status) {
    return status === OrderStatus.CANCELLED;
}
