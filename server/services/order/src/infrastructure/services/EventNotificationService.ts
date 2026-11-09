import type { INotificationService } from "../../domain/interfaces/index.js";
import type { IEventPublisher } from "../../domain/interfaces/EventPublisher.js";
import { RoutingKeys } from "@bitez/contracts";

const ROUTING_KEY = RoutingKeys.NotificationRequested;

export class EventNotificationService implements INotificationService {
  constructor(private readonly eventPublisher: IEventPublisher) {}

  async sendToUser(userId: string, message: string, type = "general"): Promise<void> {
    await this.eventPublisher.publish(ROUTING_KEY, { userId, message, type });
  }
}
