const ROUTING_KEY = "notification.requested";
export class EventNotificationService {
    eventPublisher;
    constructor(eventPublisher) {
        this.eventPublisher = eventPublisher;
    }
    async sendToUser(userId, message, type = "general") {
        await this.eventPublisher.publish(ROUTING_KEY, { userId, message, type });
    }
}
