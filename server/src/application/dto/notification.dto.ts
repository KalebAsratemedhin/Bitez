export interface ListNotificationsInput {
  userId: string;
}

export interface MarkAsSeenInput {
  notificationId: string;
  userId: string;
}
