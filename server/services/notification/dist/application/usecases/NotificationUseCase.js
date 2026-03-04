export class NotificationUseCase {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async create(input) {
        return this.deps.notificationRepository.create({
            userId: input.userId,
            message: input.message,
            type: input.type ?? "general",
        });
    }
    async listForUser(input) {
        return this.deps.notificationRepository.findByUserId(input.userId);
    }
    async markAsSeen(input) {
        const result = await this.deps.notificationRepository.markAsSeen(input.notificationId, input.userId);
        if (!result)
            throw new Error("Notification not found");
        return result;
    }
}
