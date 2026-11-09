export interface DeliveryPersonRatingReadModel {
  userId: string;
  deliveryPersonId: string;
  rating: number;
}

export interface IDeliveryPersonRepository {
  findByUserId(userId: string): Promise<DeliveryPersonRatingReadModel | null>;
  upsertRegistration(input: { userId: string; deliveryPersonId: string }): Promise<void>;
  updateRatingByDeliveryPersonId(deliveryPersonId: string, rating: number): Promise<void>;
}
