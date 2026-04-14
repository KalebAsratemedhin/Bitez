import type {
  IDeliveryRepository,
  IDeliveryPersonRepository,
  IUnassignedOrderRepository,
  IOrderReadModelRepository,
  INotificationService,
  IEventPublisher,
} from "../../domain/interfaces/index.js";

import type {
  UpdateDeliveryStatusInput,
  GetDeliveriesResult,
  AssignDeliveryInput,
  AssignDeliveryResult,
  CreateDeliveryPersonInput,
} from "../dto/delivery.dto.js";
import type { DeliveryPersonDashboardResult } from "../dto/dashboard.dto.js";

export type GetOrderByIdEnriched = (orderId: string) => Promise<unknown | null>;

export type GetUserById = (
  id: string,
) => Promise<{ _id: string; name: string; phoneNumber?: string } | null>;

export interface DeliveryUseCaseDeps {
  deliveryRepository: IDeliveryRepository;
  deliveryPersonRepository: IDeliveryPersonRepository;
  notificationService: INotificationService;
  eventPublisher: IEventPublisher;
  unassignedOrderRepository: IUnassignedOrderRepository;
  orderReadModelRepository?: IOrderReadModelRepository;
  getOrderByIdEnriched?: GetOrderByIdEnriched;
  getUserById?: GetUserById;
}

export class DeliveryUseCase {
  constructor(private readonly deps: DeliveryUseCaseDeps) {}

  async createDeliveryPerson(input: CreateDeliveryPersonInput): Promise<unknown> {
    return this.deps.deliveryPersonRepository.create({ userId: input.userId });
  }

  async hasDeliveredToCustomer(
    deliveryPersonId: string,
    customerUserId: string,
  ): Promise<boolean> {
    return this.deps.deliveryRepository.hasDeliveredToCustomer(
      deliveryPersonId,
      customerUserId,
    );
  }

  async getDeliveryPersonByUserId(userId: string): Promise<unknown | null> {
    return this.deps.deliveryPersonRepository.findByUserId(userId);
  }

  async assignDelivery(input: AssignDeliveryInput): Promise<AssignDeliveryResult> {
    const { orderId, estimatedDeliveryTime, customerId } = input;

    const dpId = await this.deps.deliveryPersonRepository.findAvailableDeliveryPersonId();
    if (!dpId) throw new Error("No delivery person available at the moment.");

    const delivery = await this.deps.deliveryRepository.create({
      orderId,
      deliveryPersonId: dpId,
      status: "assigned",
      estimatedDeliveryTime,
      ...(customerId && { customerId }),
    });

    await this.deps.deliveryPersonRepository.setPersonBusy(dpId);

    const dp = await this.deps.deliveryPersonRepository.findById(dpId);
    const deliveryPersonUserId = (dp != null && typeof dp === "object" && "userId" in dp)
      ? String((dp as { userId?: unknown }).userId ?? "")
      : "";
    const d = delivery as { _id?: unknown; orderId?: unknown; createdAt?: Date };
    if (deliveryPersonUserId) {
      await this.deps.eventPublisher.publish("delivery.created", {
        deliveryId: String(d._id ?? ""),
        orderId: String(d.orderId ?? orderId),
        deliveryPersonUserId,
        status: "assigned",
        createdAt: d.createdAt ?? new Date(),
      });
    }

    return { delivery };
  }

  async enqueueOrderForDelivery(input: {
    orderId: string;
    customerId?: string;
    restaurantId?: string;
    estimatedDeliveryTime: Date;
    deliveryAddress?: string;
    coordinates?: { lat?: number; lng?: number };
  }): Promise<void> {

    await this.deps.unassignedOrderRepository.add({
      orderId: input.orderId,
      customerId: input.customerId,
      restaurantId: input.restaurantId,
      estimatedDeliveryTime: input.estimatedDeliveryTime,
      deliveryAddress: input.deliveryAddress,
      coordinates: input.coordinates,
    });
  }

  async tryAssignNextQueuedOrder(): Promise<boolean> {
    const next = await this.deps.unassignedOrderRepository.claimOldest();
    if (!next) return false;

    try {
      await this.assignDelivery({
        orderId: next.orderId,
        estimatedDeliveryTime: next.estimatedDeliveryTime,
        customerId: next.customerId,
      });
      return true;
    } catch {
      await this.deps.unassignedOrderRepository.add(next);
      return false;
    }
  }


  async updateDeliveryStatus(input: UpdateDeliveryStatusInput): Promise<unknown> {
    const { deliveryId, status, userId } = input;

    const delivery = await this.deps.deliveryRepository.findById(deliveryId, [
      "deliveryPersonId",
      "orderId",
    ]);
    if (!delivery) throw new Error("Delivery not found.");

    const d = delivery as {
      deliveryPersonId?: { userId?: { _id?: unknown } | unknown; _id?: unknown };
      customerId?: unknown;
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

    const orderIdVal = (delivery as { orderId?: { _id?: unknown } | unknown }).orderId;
    const orderIdStr =
      orderIdVal != null && typeof orderIdVal === "object" && "_id" in orderIdVal
        ? String((orderIdVal as { _id: unknown })._id)
        : String(orderIdVal ?? "");
    const createdAt = (delivery as { createdAt?: Date }).createdAt ?? new Date();
    await this.deps.eventPublisher.publish("delivery.updated", {
      deliveryId,
      orderId: orderIdStr,
      deliveryPersonUserId: String(dpUserId),
      status,
      createdAt,
    });

    if (d.customerId) {
      await this.deps.notificationService.sendToUser(
        String(d.customerId),
        `Your delivery is ${status}`,
      );
    }

    if (status === "delivered" || status === "failed") {
      const dpId = d.deliveryPersonId?._id ?? d.deliveryPersonId;
      if (dpId) {
        await this.deps.deliveryPersonRepository.setPersonFreeIfNoPending(String(dpId));
        await this.tryAssignNextQueuedOrder();
      }
    }

    if (status === "delivered" && d.customerId) {
      const deliveryPersonId = String(d.deliveryPersonId?._id ?? d.deliveryPersonId ?? "");
      const customerId = String(d.customerId);
      if (deliveryPersonId && customerId) {
        await this.deps.eventPublisher.publish("delivery.delivered", {
          deliveryId,
          orderId: orderIdStr,
          deliveryPersonId,
          customerId,
        });
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
    const { deliveries, total } = await this.deps.deliveryRepository.findByCustomerId(
      customerId,
      page,
      limit,
    );
    if (!this.deps.getUserById || deliveries.length === 0) {
      return { deliveries, total };
    }
    const userIdStrs = new Set<string>();
    for (const d of deliveries) {
      const doc = d as { deliveryPersonId?: { userId?: unknown } | unknown };
      const dp = doc.deliveryPersonId;
      if (!dp || typeof dp !== "object" || !("userId" in dp)) continue;
      const userIdVal = (dp as { userId?: unknown }).userId;
      const userIdStr =
        userIdVal != null && typeof userIdVal === "object" && "_id" in userIdVal
          ? String((userIdVal as { _id: unknown })._id)
          : String(userIdVal ?? "");
      if (userIdStr) userIdStrs.add(userIdStr);
    }
    const userById = new Map<string, { _id: string; name: string; phoneNumber?: string }>();
    await Promise.all(
      [...userIdStrs].map(async (id) => {
        const u = await this.deps.getUserById!(id);
        if (u) userById.set(id, u);
      }),
    );
    const enriched = deliveries.map((d) => {
      const doc = d as { deliveryPersonId?: { userId?: unknown; _id?: unknown } | unknown };
      const dp = doc.deliveryPersonId;
      if (!dp || typeof dp !== "object" || !("userId" in dp)) return d;
      const userIdVal = (dp as { userId?: unknown }).userId;
      const userIdStr =
        userIdVal != null && typeof userIdVal === "object" && "_id" in userIdVal
          ? String((userIdVal as { _id: unknown })._id)
          : String(userIdVal ?? "");
      const user = userIdStr ? userById.get(userIdStr) : undefined;
      if (!user) return d;
      return {
        ...doc,
        deliveryPersonId: { ...dp, userId: { _id: user._id, name: user.name, phoneNumber: user.phoneNumber } },
      };
    });
    return { deliveries: enriched, total };
  }

  async getDeliveriesByDeliveryPersonUserId(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<GetDeliveriesResult> {
    let person = await this.deps.deliveryPersonRepository.findByUserId(userId);
    if (!person) {
      try {
        person = await this.deps.deliveryPersonRepository.create({ userId });
      } catch {
        return { deliveries: [], total: 0 };
      }
    }

    const p = person as { _id: unknown };
    const { deliveries, total } = await this.deps.deliveryRepository.findByDeliveryPersonId(
      String(p._id),
      page,
      limit,
    );

    let deliveryPerson: GetDeliveriesResult["deliveryPerson"] | undefined;
    if (this.deps.getUserById) {
      const user = await this.deps.getUserById(userId);
      if (user) {
        deliveryPerson = { name: user.name, phoneNumber: user.phoneNumber };
      }
    }

    if (deliveries.length === 0) {
      return { deliveries, total, deliveryPerson };
    }
    const orderIdStrs = new Set<string>();
    for (const d of deliveries) {
      const doc = d as { orderId?: unknown };
      const orderIdVal = doc.orderId;
      const orderIdStr =
        orderIdVal != null && typeof orderIdVal === "object" && "_id" in orderIdVal
          ? String((orderIdVal as { _id: unknown })._id)
          : String(orderIdVal ?? "");
      if (orderIdStr) orderIdStrs.add(orderIdStr);
    }
    const orderById = new Map<string, unknown>();
    if (this.deps.orderReadModelRepository) {
      await Promise.all(
        [...orderIdStrs].map(async (id) => {
          const fromReadModel = await this.deps.orderReadModelRepository!.findByOrderId(id);
          if (fromReadModel) orderById.set(id, fromReadModel);
        }),
      );
    }
    if (this.deps.getOrderByIdEnriched) {
      const missing = [...orderIdStrs].filter((id) => !orderById.has(id));
      await Promise.all(
        missing.map(async (id) => {
          const o = await this.deps.getOrderByIdEnriched!(id);
          if (o) orderById.set(id, o);
        }),
      );
    }
    const enriched = deliveries.map((d) => {
      const doc = d as { orderId?: unknown; [k: string]: unknown };
      const orderIdVal = doc.orderId;
      const orderIdStr =
        orderIdVal != null && typeof orderIdVal === "object" && "_id" in orderIdVal
          ? String((orderIdVal as { _id: unknown })._id)
          : String(orderIdVal ?? "");
      const order = orderIdStr ? orderById.get(orderIdStr) ?? null : null;
      return { ...doc, orderId: order ?? orderIdVal };
    });
    return { deliveries: enriched, total, deliveryPerson };
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
        orderId?: unknown;
      };
      const orderLabel = x.orderId != null ? String(x.orderId) : "";
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
