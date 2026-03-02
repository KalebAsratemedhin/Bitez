import { OrderStatus, orderCanBeCancelled } from "@domain/entities/Order.js";
import type {
  IOrderRepository,
  IRestaurantRepository,
  INotificationService,
  IDeliveryPersonRepository,
  IDeliveryRepository,
  IUserRepository,
  IPaymentGateway,
  ITokenService,
} from "@domain/interfaces/index.js";
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
  GetOrdersResult,
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentSuccessInput,
  PaymentSuccessResult,
} from "@application/dto/index.js";

export interface OrderUseCaseDeps {
  orderRepository: IOrderRepository;
  restaurantRepository: IRestaurantRepository;
  notificationService: INotificationService;
  deliveryPersonRepository: IDeliveryPersonRepository;
  deliveryRepository: IDeliveryRepository;
  userRepository: IUserRepository;
  paymentGateway: IPaymentGateway;
  tokenService: ITokenService;
}

export class OrderUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async createOrder(input: CreateOrderInput): Promise<unknown> {
    const { customerID, restaurantID, orderDetails, totalAmount, deliveryAddress, coordinates } =
      input;

    if (!restaurantID) throw new Error("No restaurant provided.");
    const address = typeof deliveryAddress === "string" ? deliveryAddress.trim() : "";
    if (!address) throw new Error("Delivery address is required.");

    const restaurant = await this.deps.restaurantRepository.findById(restaurantID);
    if (!restaurant) throw new Error("No restaurant provided.");
    if ((restaurant as { status?: string }).status !== "active") {
      throw new Error("Restaurant is not active.");
    }

    return this.deps.orderRepository.create({
      customerID,
      restaurantID,
      orderDetails,
      totalAmount,
      deliveryAddress: address,
      coordinates,
      status: OrderStatus.PENDING,
      paymentCompleted: true,
    });
  }

  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<unknown> {
    const { orderId, status, userId } = input;

    const oldOrder = await this.deps.orderRepository.findById(orderId);
    if (!oldOrder) throw new Error("Order not found");

    const o = oldOrder as Record<string, unknown>;
    const rid = o.restaurantID as
      | { ownerId?: { _id?: unknown } | unknown }
      | undefined;
    const ro = rid?.ownerId;
    const ownerId =
      (ro && typeof ro === "object" && "_id" in ro ? (ro as { _id?: unknown })._id : ro) ??
      rid?.ownerId;

    if (!ownerId || String(ownerId) !== userId) {
      throw new Error("You are not authorized to update this order.");
    }
    if ((o.status as string) === OrderStatus.CANCELLED) {
      throw new Error("Order is cancelled by the customer.");
    }

    if (status === "preparing") {
      await this.deps.orderRepository.updateStatus(orderId, OrderStatus.PREPARING);
      const cid = (o.customerID as { _id?: unknown })?._id ?? o.customerID;
      await this.deps.notificationService.sendToUser(
        String(cid),
        "Your order is being prepared",
      );
      return this.deps.orderRepository.findById(orderId);
    }

    if (status === "ready") {
      await this.deps.orderRepository.updateStatus(orderId, OrderStatus.READY);

      const dpId = await this.deps.deliveryPersonRepository.findAvailableDeliveryPersonId();
      if (!dpId) throw new Error("No delivery person available at the moment.");

      try {
        await this.deps.deliveryRepository.create({
          orderId,
          deliveryPersonId: dpId,
          estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
          status: "assigned",
        });
      } catch {
        await this.deps.deliveryPersonRepository.setPersonFreeIfNoPending(dpId);
        throw new Error("Failed to create delivery. Please try again.");
      }

      const cid = (o.customerID as { _id?: unknown })?._id ?? o.customerID;
      await this.deps.notificationService.sendToUser(
        String(cid),
        "Your order is ready for delivery and has been assigned to delivery",
      );
      return this.deps.orderRepository.findById(orderId);
    }

    throw new Error("Invalid status");
  }

  async cancelOrder(input: CancelOrderInput): Promise<unknown> {
    const { orderId, userId } = input;

    const order = await this.deps.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found.");

    const o = order as { customerID?: { _id?: unknown } | unknown; status?: string };
    const customerId =
      (o.customerID && typeof o.customerID === "object" && "_id" in o.customerID
        ? (o.customerID as { _id?: unknown })._id
        : o.customerID) ?? o.customerID;

    if (String(customerId) !== userId) {
      throw new Error("You are not authorized to update this order.");
    }
    if (o.status === "cancelled") throw new Error("Order already cancelled.");
    if (!orderCanBeCancelled(o.status ?? "")) {
      throw new Error("Order is past pending state and cannot be cancelled.");
    }

    return this.deps.orderRepository.updateStatus(orderId, "cancelled");
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

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const { orderId, total, userId, serverUrl } = input;

    const order = await this.deps.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const u = user as { email: string; name: string; phoneNumber?: string };
    const o = order as { _id: unknown };
    const token = await this.deps.tokenService.sign({ orderId: o._id }, "30m");
    const returnUrl = `${serverUrl}/order/payment-success?token=${token}`;

    const result = await this.deps.paymentGateway.initializePayment({
      amount: total,
      email: u.email,
      firstName: u.name,
      phoneNumber: u.phoneNumber ?? "",
      txRef: `order_${o._id}`,
      returnUrl,
    });
    if (!result.success) {
      throw new Error(result.message ?? "Payment initialization failed");
    }

    return { checkoutUrl: result.checkoutUrl, message: result.message };
  }

  async paymentSuccessCallback(input: PaymentSuccessInput): Promise<PaymentSuccessResult> {
    const decoded = (await this.deps.tokenService.verify(input.token)) as {
      orderId?: string;
    };
    const orderId = decoded.orderId;
    if (!orderId) throw new Error("Invalid token");

    if (this.deps.orderRepository.updatePaymentCompleted) {
      await this.deps.orderRepository.updatePaymentCompleted(orderId, true);
    }
    return { orderId };
  }
}
