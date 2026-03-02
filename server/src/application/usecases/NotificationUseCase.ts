import type { INotificationRepository } from "@domain/interfaces/index.js";
import type { ListNotificationsInput, MarkAsSeenInput } from "@application/dto/notification.dto.js";

export interface NotificationUseCaseDeps {
  notificationRepository: INotificationRepository;
}

export class NotificationUseCase {
  constructor(private readonly deps: NotificationUseCaseDeps) {}

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
