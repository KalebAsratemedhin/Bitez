function getUserId(req) {
    return req.user.id;
}
function parsePageLimit(req) {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit), 10) || 10));
    return { page, limit };
}
function paginationMeta(total, page, limit) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
function deliveryErrorStatus(message) {
    if (message?.includes("authorized"))
        return 401;
    if (message?.includes("not found"))
        return 404;
    if (message?.includes("available"))
        return 503;
    return 500;
}
export class DeliveryController {
    deliveryUseCase;
    constructor(deliveryUseCase) {
        this.deliveryUseCase = deliveryUseCase;
    }
    createDeliveryPerson = async (req, res) => {
        try {
            const userId = req.body?.userId;
            if (!userId) {
                res.status(400).json({ success: false, message: "userId required" });
                return;
            }
            const person = await this.deliveryUseCase.createDeliveryPerson({ userId: String(userId) });
            res.status(201).json({ success: true, deliveryPerson: person });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    assignDelivery = async (req, res) => {
        try {
            const { orderId, estimatedDeliveryTime, customerId } = req.body;
            if (!orderId || !estimatedDeliveryTime) {
                res.status(400).json({ success: false, message: "orderId and estimatedDeliveryTime required" });
                return;
            }
            const { delivery } = await this.deliveryUseCase.assignDelivery({
                orderId: String(orderId),
                estimatedDeliveryTime: new Date(estimatedDeliveryTime),
                customerId: customerId ? String(customerId) : undefined,
            });
            res.status(201).json({ success: true, delivery });
        }
        catch (e) {
            const message = e.message;
            res.status(deliveryErrorStatus(message)).json({ success: false, message });
        }
    };
    updateDeliveryStatus = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").split(",")[0];
            const delivery = await this.deliveryUseCase.updateDeliveryStatus({
                deliveryId: id,
                status: req.body.status,
                userId: getUserId(req),
            });
            res.status(200).json({ success: true, delivery });
        }
        catch (e) {
            const message = e.message;
            res.status(deliveryErrorStatus(message)).json({ success: false, message });
        }
    };
    getAllDeliveries = async (req, res) => {
        try {
            const { page, limit } = parsePageLimit(req);
            const { deliveries, total } = await this.deliveryUseCase.getAllDeliveries(page, limit);
            res.json({
                success: true,
                data: deliveries,
                pagination: paginationMeta(total, page, limit),
            });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    getCustomerDeliveries = async (req, res) => {
        try {
            const { page, limit } = parsePageLimit(req);
            const { deliveries, total } = await this.deliveryUseCase.getDeliveriesByCustomerId(getUserId(req), page, limit);
            res.status(200).json({
                success: true,
                data: deliveries,
                pagination: paginationMeta(total, page, limit),
            });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    getDeliveryPersonDeliveries = async (req, res) => {
        try {
            const { page, limit } = parsePageLimit(req);
            const { deliveries, total, deliveryPerson } = await this.deliveryUseCase.getDeliveriesByDeliveryPersonUserId(getUserId(req), page, limit);
            res.status(200).json({
                success: true,
                data: deliveries,
                pagination: paginationMeta(total, page, limit),
                ...(deliveryPerson && { deliveryPerson }),
            });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    hasDeliveredToUser = async (req, res) => {
        try {
            const deliveryPersonId = String(req.params.id ?? "").split(",")[0];
            const userId = String(req.params.userId ?? "").split(",")[0];
            if (!deliveryPersonId || !userId) {
                res.status(400).json({ delivered: false });
                return;
            }
            const delivered = await this.deliveryUseCase.hasDeliveredToCustomer(deliveryPersonId, userId);
            res.json({ delivered });
        }
        catch (e) {
            res.status(500).json({ delivered: false });
        }
    };
    getDeliveryPersonByUserId = async (req, res) => {
        try {
            const userId = String(req.params.userId ?? "").split(",")[0];
            if (!userId) {
                res.status(400).json({ success: false, message: "userId required" });
                return;
            }
            const person = await this.deliveryUseCase.getDeliveryPersonByUserId(userId);
            if (!person) {
                res.status(404).json({ success: false, message: "Delivery person not found" });
                return;
            }
            res.status(200).json(person);
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    getDeliveryPersonDashboard = async (req, res) => {
        try {
            const result = await this.deliveryUseCase.getDeliveryPersonDashboard(getUserId(req));
            res.status(200).json({ success: true, ...result });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
}
