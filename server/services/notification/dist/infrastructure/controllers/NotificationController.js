export class NotificationController {
    notificationUseCase;
    constructor(notificationUseCase) {
        this.notificationUseCase = notificationUseCase;
    }
    notify = async (req, res) => {
        try {
            const { userId, message, type } = req.body;
            if (!userId || !message) {
                res.status(400).json({ error: "userId and message required" });
                return;
            }
            await this.notificationUseCase.create({
                userId: String(userId),
                message: String(message),
                type: type ? String(type) : undefined,
            });
            res.status(201).json({ success: true });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    list = async (req, res) => {
        try {
            const userId = req.user.id;
            const list = await this.notificationUseCase.listForUser({ userId });
            const out = list.map((n) => {
                const x = n;
                return {
                    _id: x._id?.toString?.() ?? String(x._id),
                    message: x.message ?? "",
                    createdAt: x.createdAt ?? new Date(),
                    seen: x.seen ?? false,
                };
            });
            res.json(out);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    markAsSeen = async (req, res) => {
        try {
            const userId = req.user.id;
            const id = String(req.params.id ?? "").split(",")[0];
            const notification = await this.notificationUseCase.markAsSeen({
                notificationId: id,
                userId,
            });
            const x = notification;
            res.json({
                _id: x._id?.toString?.() ?? String(x._id),
                message: x.message ?? "",
                createdAt: x.createdAt ?? new Date(),
                seen: true,
            });
        }
        catch (e) {
            const err = e;
            if (err.message?.includes("not found"))
                res.status(404).json({ error: err.message });
            else
                res.status(500).json({ error: err.message });
        }
    };
}
