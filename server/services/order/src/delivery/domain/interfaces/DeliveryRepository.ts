export interface IDeliveryRepository {
  findById(id: string, populate?: string[]): Promise<unknown | null>;
  create(data: Record<string, unknown>): Promise<unknown>;
  findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ deliveries: unknown[]; total: number }>;
  findByDeliveryPersonId(
    deliveryPersonId: string,
    page: number,
    limit: number,
  ): Promise<{ deliveries: unknown[]; total: number }>;
  findByCustomerId(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<{ deliveries: unknown[]; total: number }>;
  hasDeliveredToCustomer(deliveryPersonId: string, customerUserId: string): Promise<boolean>;
  updateStatus(deliveryId: string, status: string): Promise<void>;
}
