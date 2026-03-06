import { OrderStatus, orderCanBeCancelled } from "../../domain/entities/Order.js";
import type {
  IOrderRepository,
  IRestaurantRepository,
  IRestaurantReadModelRepository,
  INotificationService,
  IUserRepository,
  IPaymentGateway,
  ITokenService,
  IEventPublisher,
} from "../../domain/interfaces/index.js";
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
  GetOrdersResult,
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentSuccessInput,
  PaymentSuccessResult,
} from "../dto/order.dto.js";

export type GetCustomerById = (
  id: string,
) => Promise<{ _id: string; name: string; phoneNumber?: string } | null>;

export interface OrderUseCaseDeps {
  orderRepository: IOrderRepository;
  restaurantRepository: IRestaurantRepository;
  restaurantReadModelRepository?: IRestaurantReadModelRepository;
  notificationService: INotificationService;
  userRepository: IUserRepository;
  paymentGateway: IPaymentGateway;
  tokenService: ITokenService;
  eventPublisher: IEventPublisher;
  getCustomerById?: GetCustomerById;
}

function toRefId(value: unknown): string {
  return value != null ? String(value) : "";
}

type OrderRecord = Record<string, unknown>;

type OrderContext = {
  customerId: string;
  restaurantId: string;
  totalAmount: number;
  createdAt: Date;
  order: OrderRecord;
};

export class OrderUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async createOrder(input: CreateOrderInput): Promise<unknown> {
    const { restaurantID, deliveryAddress } = this.validateCreateOrderInput(input);

    const restaurant = await this.validateRestaurantActive(restaurantID);

    const createdOrder = await this.persistOrder(input, restaurantID, deliveryAddress);

    await this.publishOrderCreated(createdOrder as OrderRecord);

    return createdOrder;
  }

  private validateCreateOrderInput(input: CreateOrderInput): {
    restaurantID: string;
    deliveryAddress: string;
  } {
    const { restaurantID, deliveryAddress } = input;

    if (!restaurantID) throw new Error("No restaurant provided.");

    const address = typeof deliveryAddress === "string" ? deliveryAddress.trim() : "";
    if (!address) throw new Error("Delivery address is required.");

    return { ...input, deliveryAddress: address };
  }

  private async validateRestaurantActive(restaurantID: string): Promise<unknown> {
    if (this.deps.restaurantReadModelRepository) {
      const cached = await this.deps.restaurantReadModelRepository.findById(restaurantID);
      if (cached) {
        if (cached.status !== "active") {
          throw new Error("Restaurant is not active.");
        }
        return cached;
      }
    }
    const restaurant = await this.deps.restaurantRepository.findById(restaurantID);
    if (!restaurant) throw new Error("No restaurant provided.");
    if ((restaurant as { status?: string }).status !== "active") {
      throw new Error("Restaurant is not active.");
    }
    return restaurant;
  }

  private async persistOrder(
    input: CreateOrderInput,
    restaurantID: string,
    deliveryAddress: string,
  ): Promise<unknown> {
    return this.deps.orderRepository.create({
      ...input,
      restaurantID,
      deliveryAddress,
      status: OrderStatus.PENDING,
      paymentCompleted: true,
    });
  }

  private async publishOrderCreated(createdOrder: OrderRecord): Promise<void> {
    const coords = createdOrder.coordinates as { lat?: number; lng?: number } | undefined;
    await this.deps.eventPublisher.publish("order.created", {
      orderId: toRefId(createdOrder._id),
      customerId: toRefId(createdOrder.customerID),
      restaurantId: toRefId(createdOrder.restaurantID),
      totalAmount: (createdOrder.totalAmount as number) ?? 0,
      status: (createdOrder.status as string) ?? OrderStatus.PENDING,
      createdAt: (createdOrder.createdAt as Date) ?? new Date(),
      deliveryAddress: typeof createdOrder.deliveryAddress === "string" ? createdOrder.deliveryAddress : undefined,
      coordinates: coords != null ? coords : undefined,
    });
  }

  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<unknown> {
    const { orderId, status, userId } = input;

    const context = await this.getOrderContextAndValidateOwnership(orderId, userId);

    if (status === "preparing") {
      return this.handlePreparingStatus(orderId, context);
    }

    if (status === "ready") {
      return this.handleReadyStatus(orderId, context);
    }

    throw new Error("Invalid status");
  }

  private async getOrderContextAndValidateOwnership(
    orderId: string,
    userId: string,
  ): Promise<OrderContext> {
    const order = await this.deps.orderRepository.findById(orderId);

    if (!order) throw new Error("Order not found");

    const orderRecord = order as OrderRecord;
    const restaurantId = toRefId(orderRecord.restaurantID);

    const restaurant = await this.deps.restaurantRepository.findById(restaurantId);

    if (!restaurant) throw new Error("Order not found");

    const ownerId = toRefId((restaurant as { ownerId?: unknown }).ownerId);

    if (!ownerId || ownerId !== userId) {
      throw new Error("You are not authorized to update this order.");
    }
    if ((orderRecord.status as string) === OrderStatus.CANCELLED) {
      throw new Error("Order is cancelled by the customer.");
    }

    return {
      customerId: toRefId(orderRecord.customerID),
      restaurantId,
      totalAmount: (orderRecord.totalAmount as number) ?? 0,
      createdAt: (orderRecord.createdAt as Date) ?? new Date(),
      order: orderRecord,
    };
  }

  private async publishOrderUpdated(
    orderId: string,
    context: { customerId: string; restaurantId: string; totalAmount: number; createdAt: Date },
    status: string,
  ): Promise<void> {
    await this.deps.eventPublisher.publish("order.updated", {
      orderId,
      customerId: context.customerId,
      restaurantId: context.restaurantId,
      totalAmount: context.totalAmount,
      status,
      createdAt: context.createdAt,
    });
  }

  private async handlePreparingStatus(
    orderId: string,
    context: { customerId: string; restaurantId: string; totalAmount: number; createdAt: Date },
  ): Promise<unknown> {
    await this.deps.orderRepository.updateStatus(orderId, OrderStatus.PREPARING);
    await this.publishOrderUpdated(orderId, context, OrderStatus.PREPARING);
    await this.deps.notificationService.sendToUser(
      context.customerId,
      "Your order is being prepared",
    );

    return this.deps.orderRepository.findById(orderId);
  }

  private async handleReadyStatus(orderId: string, context: OrderContext): Promise<unknown> {
    const order = context.order;

    await this.deps.orderRepository.updateStatus(orderId, OrderStatus.READY);
    await this.publishOrderUpdated(orderId, context, OrderStatus.READY);

    const estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000);

    await this.deps.eventPublisher.publish("order.ready_for_delivery", {
      orderId,
      customerId: context.customerId,
      restaurantId: context.restaurantId,
      estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
      deliveryAddress: typeof order.deliveryAddress === "string" ? order.deliveryAddress : undefined,
      coordinates:
        order.coordinates != null
          ? (order.coordinates as { lat?: number; lng?: number })
          : undefined,
    });

    await this.deps.notificationService.sendToUser(
      context.customerId,
      "Your order is ready for delivery. We are finding a delivery person for you",
    );

    return this.deps.orderRepository.findById(orderId);
  }

  async cancelOrder(input: CancelOrderInput): Promise<unknown> {
    const { orderId, userId } = input;

    const order = await this.deps.orderRepository.findById(orderId);

    if (!order) throw new Error("Order not found.");

    const orderRecord = order as OrderRecord;
    const customerId = toRefId(orderRecord.customerID);

    if (customerId !== userId) {
      throw new Error("You are not authorized to update this order.");
    }
    if ((orderRecord.status as string) === OrderStatus.CANCELLED) {
      throw new Error("Order already cancelled.");
    }
    if (!orderCanBeCancelled((orderRecord.status as string) ?? "")) {
      throw new Error("Order is past pending state and cannot be cancelled.");
    }

    await this.deps.orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);

    await this.publishOrderUpdated(orderId, {
      customerId,
      restaurantId: toRefId(orderRecord.restaurantID),
      totalAmount: (orderRecord.totalAmount as number) ?? 0,
      createdAt: (orderRecord.createdAt as Date) ?? new Date(),
    }, OrderStatus.CANCELLED);

    return this.deps.orderRepository.findById(orderId);
  }

  async getAllOrders(page = 1, limit = 10): Promise<GetOrdersResult> {
    return this.deps.orderRepository.find({}, page, limit);
  }

  async getOrdersByCustomerId(
    customerId: string,
    page = 1,
    limit = 10,
  ): Promise<GetOrdersResult> {
    return this.deps.orderRepository.findByCustomerId(customerId, page, limit);
  }

  async getOrdersByRestaurantId(
    restaurantId: string,
    page = 1,
    limit = 10,
  ): Promise<GetOrdersResult> {
    return this.deps.orderRepository.findByRestaurantId(restaurantId, page, limit);
  }

  async getOrderById(orderId: string): Promise<unknown> {
    return this.deps.orderRepository.findById(orderId);
  }

  async getOrderByIdEnriched(orderId: string): Promise<unknown | null> {
    const order = await this.deps.orderRepository.findById(orderId);

    if (!order) return null;

    const orderRecord = order as OrderRecord;
    const restaurantId = toRefId(orderRecord.restaurantID);
    const customerId = toRefId(orderRecord.customerID);

    const restaurantSummary = await this.getRestaurantSummary(restaurantId);
    const customerSummary = await this.getCustomerSummary(customerId);

    return { ...orderRecord, restaurantID: restaurantSummary, customerID: customerSummary };
  }

  private async getRestaurantSummary(
    restaurantId: string,
  ): Promise<{ _id: string; name: string }> {
    if (!restaurantId) return { _id: restaurantId, name: "" };

    const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
    const record = restaurant as { _id?: unknown; name?: string } | null;

    return record != null
      ? { _id: String(record._id ?? restaurantId), name: String(record.name ?? "") }
      : { _id: restaurantId, name: "" };
  }

  private async getCustomerSummary(
    customerId: string,
  ): Promise<{ _id: string; name: string; phoneNumber?: string }> {
    const fallback = { _id: customerId, name: "" };

    if (!customerId || !this.deps.getCustomerById) return fallback;

    const customer = await this.deps.getCustomerById(customerId);

    return customer ?? fallback;
  }

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const { orderId, total, userId, serverUrl, authHeader } = input;

    const order = await this.deps.orderRepository.findById(orderId);

    if (!order) throw new Error("Order not found");

    const user = await this.deps.userRepository.findById(userId, { authHeader });

    if (!user) throw new Error("User not found");

    const userRecord = user as { email: string; name: string; phoneNumber?: string };
    const orderRecord = order as { _id: unknown };
    const token = await this.deps.tokenService.sign({ orderId: orderRecord._id }, "30m");
    const returnUrl = `${serverUrl}/order/payment-success?token=${token}`;

    const result = await this.deps.paymentGateway.initializePayment({
      amount: total,
      email: userRecord.email,
      firstName: userRecord.name,
      phoneNumber: userRecord.phoneNumber ?? "",
      txRef: `order_${orderRecord._id}`,
      returnUrl,
    });

    if (!result.success) {
      throw new Error(result.message ?? "Payment initialization failed");
    }

    return { checkoutUrl: result.checkoutUrl, message: result.message };
  }

  async paymentSuccessCallback(input: PaymentSuccessInput): Promise<PaymentSuccessResult> {
    const decoded = (await this.deps.tokenService.verify(input.token)) as { orderId?: string };
    const orderId = decoded.orderId;

    if (!orderId) throw new Error("Invalid token");

    if (this.deps.orderRepository.updatePaymentCompleted) {
      await this.deps.orderRepository.updatePaymentCompleted(orderId, true);
    }

    return { orderId };
  }
}