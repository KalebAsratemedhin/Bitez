export interface ListNotificationsInput {
  userId: string;
}

export interface MarkAsSeenInput {
  notificationId: string;
  userId: string;
}

export interface CreateNotificationInput {
  userId: string;
  message: string;
  type?: string;
}
