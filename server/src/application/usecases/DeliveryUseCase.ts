import type {
  IDeliveryRepository,
  IDeliveryPersonRepository,
  INotificationService,
} from "@domain/interfaces/index.js";
import type {
  UpdateDeliveryStatusInput,
  GetDeliveriesResult,
} from "@application/dto/index.js";
import type { DeliveryPersonDashboardResult } from "@application/dto/dashboard.dto.js";

export interface DeliveryUseCaseDeps {
  deliveryRepository: IDeliveryRepository;
  deliveryPersonRepository: IDeliveryPersonRepository;
  notificationService: INotificationService;
}

export class DeliveryUseCase {
  constructor(private readonly deps: DeliveryUseCaseDeps) {}

  async updateDeliveryStatus(input: UpdateDeliveryStatusInput): Promise<unknown> {
    const { deliveryId, status, userId } = input;

    const delivery = await this.deps.deliveryRepository.findById(deliveryId, [
      "deliveryPersonId",
      "orderId",
    ]);
    if (!delivery) throw new Error("Delivery not found.");

    const d = delivery as {
      deliveryPersonId?: { userId?: { _id?: unknown } | unknown; _id?: unknown };
    };
    const dp = d.deliveryPersonId;
    const dpUserId =
      (dp?.userId && typeof dp.userId === "object" && "_id" in dp.userId
        ? (dp.userId as { _id?: unknown })._id
        : dp?.userId) ?? dp?.userId;
    if (!dpUserId || String(dpUserId) !== userId) {
      throw new Error("You are not authorized to update this delivery.");
    }

    await this.deps.deliveryRepository.updateStatus(deliveryId, status);

    const ord = delivery as {
      orderId?: { customerID?: { _id?: unknown } | unknown };
    };
    const oc = ord.orderId?.customerID;
    const customerId =
      (oc && typeof oc === "object" && "_id" in oc ? (oc as { _id?: unknown })._id : oc) ??
      ord.orderId?.customerID;
    if (customerId) {
      await this.deps.notificationService.sendToUser(
        String(customerId),
        `Your delivery is ${status}`,
      );
    }

    if (status === "delivered" || status === "failed") {
      const dpId = d.deliveryPersonId?._id ?? d.deliveryPersonId;
      if (dpId) {
        await this.deps.deliveryPersonRepository.setPersonFreeIfNoPending(String(dpId));
      }
    }

    return this.deps.deliveryRepository.findById(deliveryId, [
      "deliveryPersonId",
      "orderId",
    ]);
  }

  async getAllDeliveries(page = 1, limit = 10): Promise<GetDeliveriesResult> {
    return this.deps.deliveryRepository.findAllPaginated(page, limit);
  }

  async getDeliveriesByCustomerId(
    customerId: string,
    page = 1,
    limit = 10,
  ): Promise<GetDeliveriesResult> {
    return this.deps.deliveryRepository.findByCustomerId(customerId, page, limit);
  }

  async getDeliveriesByDeliveryPersonUserId(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<GetDeliveriesResult> {
    const person = await this.deps.deliveryPersonRepository.findByUserId(userId);
    if (!person) return { deliveries: [], total: 0 };

    const p = person as { _id: unknown };
    return this.deps.deliveryRepository.findByDeliveryPersonId(String(p._id), page, limit);
  }

  async getDeliveryPersonDashboard(userId: string): Promise<DeliveryPersonDashboardResult> {
    const { deliveries, total } = await this.getDeliveriesByDeliveryPersonUserId(
      userId,
      1,
      2000,
    );
    const statusToDisplay: Record<string, string> = {
      delivered: "Completed",
      failed: "Cancelled",
      cancelled: "Cancelled",
    };
    const displayCounts: Record<string, number> = { Completed: 0, Cancelled: 0, "In Progress": 0 };
    deliveries.forEach((d) => {
      const s = (d as { status?: string }).status ?? "";
      const name = statusToDisplay[s.toLowerCase()] ?? "In Progress";
      displayCounts[name] = (displayCounts[name] ?? 0) + 1;
    });
    const deliveryData = [
      { name: "Completed", value: displayCounts.Completed },
      { name: "Cancelled", value: displayCounts.Cancelled },
      { name: "In Progress", value: displayCounts["In Progress"] },
    ];
    const recentDeliveries = deliveries.slice(0, 10).map((d) => {
      const x = d as {
        _id?: unknown;
        status?: string;
        createdAt?: Date;
        orderId?: { _id?: unknown; restaurantID?: { name?: string } };
      };
      const orderLabel =
        x.orderId && typeof x.orderId === "object" && x.orderId.restaurantID
          ? typeof x.orderId.restaurantID === "object" && "name" in x.orderId.restaurantID
            ? String((x.orderId.restaurantID as { name?: string }).name)
            : String(x.orderId._id ?? "")
          : String(x.orderId ?? "");
      return {
        id: String(x._id ?? ""),
        order: orderLabel,
        status: statusToDisplay[(x.status ?? "").toLowerCase()] ?? x.status ?? "In Progress",
        time: x.createdAt ? new Date(x.createdAt).toISOString() : "",
      };
    });
    return {
      totalDeliveries: total,
      deliveryData,
      recentDeliveries,
    };
  }
}
