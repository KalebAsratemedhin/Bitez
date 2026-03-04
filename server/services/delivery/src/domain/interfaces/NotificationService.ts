export interface INotificationService {
  sendToUser(userId: string, message: string, type?: string): Promise<void>;
}
