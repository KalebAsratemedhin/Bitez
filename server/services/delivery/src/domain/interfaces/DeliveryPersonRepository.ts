export interface IDeliveryPersonRepository {
  create(data: Record<string, unknown>): Promise<unknown>;
  findById(id: string, populate?: string[]): Promise<unknown | null>;
  findByUserId(userId: string): Promise<unknown | null>;
  findAvailableDeliveryPersonId(): Promise<string | null>;
  updateStatus(deliveryPersonId: string, status: string): Promise<void>;
  countPendingDeliveries(deliveryPersonId: string): Promise<number>;
  setPersonBusy(deliveryPersonId: string): Promise<void>;
  setPersonFreeIfNoPending(deliveryPersonId: string): Promise<void>;
  updateRating(deliveryPersonId: string, rating: number): Promise<void>;
}
