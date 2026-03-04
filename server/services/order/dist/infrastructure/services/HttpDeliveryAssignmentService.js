export class HttpDeliveryAssignmentService {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async assignDelivery(orderId, estimatedDeliveryTime, customerId) {
        const url = `${this.baseUrl.replace(/\/$/, "")}/assign`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId,
                estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
                ...(customerId && { customerId }),
            }),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "No delivery person available at the moment.");
        }
    }
}
