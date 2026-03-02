export interface INotificationRepository {
  findByUserId(userId: string): Promise<unknown[]>;
  markAsSeen(id: string, userId: string): Promise<unknown | null>;
}
