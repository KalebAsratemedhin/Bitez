import type { INotificationRepository } from "../../domain/interfaces/index.js";
import type {
  ListNotificationsInput,
  MarkAsSeenInput,
  CreateNotificationInput,
} from "../dto/notification.dto.js";

export interface NotificationUseCaseDeps {
  notificationRepository: INotificationRepository;
}

export class NotificationUseCase {
  constructor(private readonly deps: NotificationUseCaseDeps) {}

  async create(input: CreateNotificationInput): Promise<unknown> {
    return this.deps.notificationRepository.create({
      userId: input.userId,
      message: input.message,
      type: input.type ?? "general",
    });
  }

  async listForUser(input: ListNotificationsInput): Promise<unknown[]> {
    return this.deps.notificationRepository.findByUserId(input.userId);
  }

  async markAsSeen(input: MarkAsSeenInput): Promise<unknown> {
    const result = await this.deps.notificationRepository.markAsSeen(
      input.notificationId,
      input.userId,
    );
    if (!result) throw new Error("Notification not found");
    return result;
  }
}
