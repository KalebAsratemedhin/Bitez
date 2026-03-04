export interface IDeliveryPersonRepository {
  findByUserId(userId: string): Promise<unknown | null>;
}
