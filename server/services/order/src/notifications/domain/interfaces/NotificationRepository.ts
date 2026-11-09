export interface INotificationRepository {
  create(data: { userId: string; message: string; type?: string }): Promise<unknown>;
  findByUserId(userId: string): Promise<unknown[]>;
  markAsSeen(id: string, userId: string): Promise<unknown | null>;
}
