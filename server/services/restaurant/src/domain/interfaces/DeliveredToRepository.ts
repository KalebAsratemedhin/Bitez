export interface IDeliveredToRepository {
  record(deliveryPersonId: string, customerUserId: string): Promise<void>;
  hasDeliveredTo(deliveryPersonId: string, customerUserId: string): Promise<boolean>;
}
