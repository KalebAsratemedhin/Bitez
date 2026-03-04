function getUserId(req) {
    return req.user.id;
}
function getAuthHeader(req) {
    const h = req.headers.authorization ?? req.headers.Authorization;
    return typeof h === "string" ? h : undefined;
}
function parsePageLimit(req) {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit), 10) || 10));
    return { page, limit };
}
function paginationMeta(total, page, limit) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
function orderErrorStatus(message) {
    if (message?.includes("authorized") || message?.includes("cancelled"))
        return 401;
    if (message?.includes("Invalid") || message?.includes("not active"))
        return 400;
    if (message?.includes("not found"))
        return 404;
    return 500;
}
export class OrderController {
    orderUseCase;
    constructor(orderUseCase) {
        this.orderUseCase = orderUseCase;
    }
    createOrder = async (req, res) => {
        try {
            const order = await this.orderUseCase.createOrder({
                ...req.body,
                customerID: getUserId(req),
            });
            res.status(201).json({ success: true, message: "Order created successfully.", order });
        }
        catch (e) {
            const err = e;
            console.error("[OrderController.createOrder]", err.message, err.stack);
            const message = err.message;
            const status = message?.includes("not active") ? 400 : 500;
            res.status(status).json({ success: false, message });
        }
    };
    updateOrderStatus = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            const order = await this.orderUseCase.updateOrderStatus({
                orderId: id,
                status: req.body.status,
                userId: getUserId(req),
            });
            res.status(200).json({ success: true, order });
        }
        catch (e) {
            const message = e.message;
            res.status(orderErrorStatus(message)).json({ success: false, message });
        }
    };
    cancelOrder = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            const order = await this.orderUseCase.cancelOrder({
                orderId: id,
                userId: getUserId(req),
            });
            res.status(200).json({ success: true, order });
        }
        catch (e) {
            const message = e.message;
            const status = message?.includes("authorized") ? 401
                : message?.includes("already") || message?.includes("cannot") ? 400
                    : message?.includes("not found") ? 404
                        : 500;
            res.status(status).json({ success: false, message });
        }
    };
    getAllOrders = async (req, res) => {
        try {
            const { page, limit } = parsePageLimit(req);
            const { orders, total } = await this.orderUseCase.getAllOrders(page, limit);
            res.json({
                success: true,
                data: orders,
                pagination: paginationMeta(total, page, limit),
            });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    getCustomerOrders = async (req, res) => {
        try {
            const { page, limit } = parsePageLimit(req);
            const { orders, total } = await this.orderUseCase.getOrdersByCustomerId(getUserId(req), page, limit);
            res.status(200).json({
                success: true,
                data: orders,
                pagination: paginationMeta(total, page, limit),
            });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    getRestaurantOrders = async (req, res) => {
        try {
            const { page, limit } = parsePageLimit(req);
            const id = String(req.params.id ?? "").split(",")[0];
            const { orders, total } = await this.orderUseCase.getOrdersByRestaurantId(id, page, limit);
            res.status(200).json({
                success: true,
                data: orders,
                pagination: paginationMeta(total, page, limit),
            });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    getOrderById = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            const order = await this.orderUseCase.getOrderById(id);
            if (!order) {
                res.status(404).json({ success: false, message: "Order not found" });
                return;
            }
            res.status(200).json({ success: true, order });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    /** Internal: enriched order (restaurant + customer) for delivery service. */
    getInternalOrderById = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            const order = await this.orderUseCase.getOrderByIdEnriched(id);
            if (!order) {
                res.status(404).json({ success: false, message: "Order not found" });
                return;
            }
            res.status(200).json(order);
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    payForOrder = async (req, res) => {
        try {
            const result = await this.orderUseCase.initializePayment({
                orderId: req.body.orderId,
                total: req.body.total,
                userId: getUserId(req),
                serverUrl: process.env.SERVER_URL,
                authHeader: getAuthHeader(req),
            });
            res.status(201).json({ message: result.message, url: result.checkoutUrl });
        }
        catch (e) {
            res.status(500).json({ message: e.message });
        }
    };
    paymentSuccess = async (req, res) => {
        try {
            const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
            const { orderId } = await this.orderUseCase.paymentSuccessCallback({
                token: String(token ?? ""),
            });
            const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
            res.redirect(`${clientUrl}/order-confirmation/${orderId}`);
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
}
