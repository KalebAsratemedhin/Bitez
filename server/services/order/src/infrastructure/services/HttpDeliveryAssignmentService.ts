import type { IDeliveryAssignmentService } from "../../domain/interfaces/index.js";

export class HttpDeliveryAssignmentService implements IDeliveryAssignmentService {
  constructor(private readonly baseUrl: string) {}

  async assignDelivery(
    orderId: string,
    estimatedDeliveryTime: Date,
    customerId?: string,
  ): Promise<void> {
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
