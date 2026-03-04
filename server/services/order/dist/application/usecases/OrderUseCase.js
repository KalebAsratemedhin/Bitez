import { OrderStatus, orderCanBeCancelled } from "../../domain/entities/Order.js";
export class OrderUseCase {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async createOrder(input) {
        const { customerID, restaurantID, orderDetails, totalAmount, deliveryAddress, coordinates } = input;
        if (!restaurantID)
            throw new Error("No restaurant provided.");
        const address = typeof deliveryAddress === "string" ? deliveryAddress.trim() : "";
        if (!address)
            throw new Error("Delivery address is required.");
        const restaurant = await this.deps.restaurantRepository.findById(restaurantID);
        if (!restaurant)
            throw new Error("No restaurant provided.");
        if (restaurant.status !== "active") {
            throw new Error("Restaurant is not active.");
        }
        const created = await this.deps.orderRepository.create({
            customerID,
            restaurantID,
            orderDetails,
            totalAmount,
            deliveryAddress: address,
            coordinates,
            status: OrderStatus.PENDING,
            paymentCompleted: true,
        });
        const ord = created;
        const cid = ord.customerID != null && typeof ord.customerID === "object" && "_id" in ord.customerID
            ? String(ord.customerID._id)
            : String(ord.customerID ?? "");
        const rid = ord.restaurantID != null && typeof ord.restaurantID === "object" && "_id" in ord.restaurantID
            ? String(ord.restaurantID._id)
            : String(ord.restaurantID ?? "");
        await this.deps.eventPublisher.publish("order.created", {
            orderId: String(ord._id ?? ""),
            customerId: cid,
            restaurantId: rid,
            totalAmount: ord.totalAmount ?? 0,
            status: ord.status ?? OrderStatus.PENDING,
            createdAt: ord.createdAt ?? new Date(),
        });
        return created;
    }
    async updateOrderStatus(input) {
        const { orderId, status, userId } = input;
        const oldOrder = await this.deps.orderRepository.findById(orderId);
        if (!oldOrder)
            throw new Error("Order not found");
        const o = oldOrder;
        const restaurantId = o.restaurantID != null && typeof o.restaurantID === "object" && "_id" in o.restaurantID
            ? String(o.restaurantID._id)
            : String(o.restaurantID ?? "");
        const restaurant = await this.deps.restaurantRepository.findById(restaurantId);
        if (!restaurant)
            throw new Error("Order not found");
        const r = restaurant;
        const ro = r.ownerId;
        const ownerId = ro != null && typeof ro === "object" && "_id" in ro
            ? String(ro._id)
            : String(ro ?? "");
        if (!ownerId || ownerId !== userId) {
            throw new Error("You are not authorized to update this order.");
        }
        if (o.status === OrderStatus.CANCELLED) {
            throw new Error("Order is cancelled by the customer.");
        }
        const cid = (o.customerID != null && typeof o.customerID === "object" && "_id" in o.customerID)
            ? String(o.customerID._id)
            : String(o.customerID ?? "");
        const rid = (o.restaurantID != null && typeof o.restaurantID === "object" && "_id" in o.restaurantID)
            ? String(o.restaurantID._id)
            : String(o.restaurantID ?? "");
        const totalAmount = o.totalAmount ?? 0;
        const createdAt = o.createdAt ?? new Date();
        const publishOrderUpdated = async (newStatus) => {
            await this.deps.eventPublisher.publish("order.updated", {
                orderId,
                customerId: cid,
                restaurantId: rid,
                totalAmount,
                status: newStatus,
                createdAt,
            });
        };
        if (status === "preparing") {
            await this.deps.orderRepository.updateStatus(orderId, OrderStatus.PREPARING);
            await publishOrderUpdated(OrderStatus.PREPARING);
            await this.deps.notificationService.sendToUser(cid, "Your order is being prepared");
            return this.deps.orderRepository.findById(orderId);
        }
        if (status === "ready") {
            await this.deps.orderRepository.updateStatus(orderId, OrderStatus.READY);
            await publishOrderUpdated(OrderStatus.READY);
            const estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000);
            await this.deps.deliveryAssignmentService.assignDelivery(orderId, estimatedDeliveryTime, cid);
            await this.deps.notificationService.sendToUser(cid, "Your order is ready for delivery and has been assigned to delivery");
            return this.deps.orderRepository.findById(orderId);
        }
        throw new Error("Invalid status");
    }
    async cancelOrder(input) {
        const { orderId, userId } = input;
        const order = await this.deps.orderRepository.findById(orderId);
        if (!order)
            throw new Error("Order not found.");
        const o = order;
        const customerId = (o.customerID && typeof o.customerID === "object" && "_id" in o.customerID
            ? o.customerID._id
            : o.customerID) ?? o.customerID;
        if (String(customerId) !== userId) {
            throw new Error("You are not authorized to update this order.");
        }
        if (o.status === "cancelled")
            throw new Error("Order already cancelled.");
        if (!orderCanBeCancelled(o.status ?? "")) {
            throw new Error("Order is past pending state and cannot be cancelled.");
        }
        await this.deps.orderRepository.updateStatus(orderId, "cancelled");
        const rid = (o.restaurantID != null && typeof o.restaurantID === "object" && "_id" in o.restaurantID)
            ? String(o.restaurantID._id)
            : String(o.restaurantID ?? "");
        await this.deps.eventPublisher.publish("order.updated", {
            orderId,
            customerId: String(customerId),
            restaurantId: rid,
            totalAmount: o.totalAmount ?? 0,
            status: "cancelled",
            createdAt: o.createdAt ?? new Date(),
        });
        return this.deps.orderRepository.findById(orderId);
    }
    async getAllOrders(page = 1, limit = 10) {
        return this.deps.orderRepository.find({}, page, limit);
    }
    async getOrdersByCustomerId(customerId, page = 1, limit = 10) {
        return this.deps.orderRepository.findByCustomerId(customerId, page, limit);
    }
    async getOrdersByRestaurantId(restaurantId, page = 1, limit = 10) {
        return this.deps.orderRepository.findByRestaurantId(restaurantId, page, limit);
    }
    async getOrderById(orderId) {
        return this.deps.orderRepository.findById(orderId);
    }
    /** Internal: return order with restaurant and customer populated for delivery/other services. */
    async getOrderByIdEnriched(orderId) {
        const order = await this.deps.orderRepository.findById(orderId);
        if (!order)
            return null;
        const o = order;
        const restaurantId = o.restaurantID != null && typeof o.restaurantID === "object" && "_id" in o.restaurantID
            ? String(o.restaurantID._id)
            : String(o.restaurantID ?? "");
        const customerId = o.customerID != null && typeof o.customerID === "object" && "_id" in o.customerID
            ? String(o.customerID._id)
            : String(o.customerID ?? "");
        const restaurant = restaurantId
            ? await this.deps.restaurantRepository.findById(restaurantId)
            : null;
        const r = restaurant;
        const restaurantID = r != null
            ? { _id: String(r._id ?? restaurantId), name: String(r?.name ?? "") }
            : { _id: restaurantId, name: "" };
        let customerID = {
            _id: customerId,
            name: "",
        };
        if (this.deps.getCustomerById && customerId) {
            const customer = await this.deps.getCustomerById(customerId);
            if (customer)
                customerID = customer;
        }
        return { ...o, restaurantID, customerID };
    }
    async initializePayment(input) {
        const { orderId, total, userId, serverUrl, authHeader } = input;
        const order = await this.deps.orderRepository.findById(orderId);
        if (!order)
            throw new Error("Order not found");
        const user = await this.deps.userRepository.findById(userId, { authHeader });
        if (!user)
            throw new Error("User not found");
        const u = user;
        const o = order;
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
    async paymentSuccessCallback(input) {
        const decoded = (await this.deps.tokenService.verify(input.token));
        const orderId = decoded.orderId;
        if (!orderId)
            throw new Error("Invalid token");
        if (this.deps.orderRepository.updatePaymentCompleted) {
            await this.deps.orderRepository.updatePaymentCompleted(orderId, true);
        }
        return { orderId };
    }
}
