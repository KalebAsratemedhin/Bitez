export interface IRestaurantRepository {
  findById(id: string): Promise<unknown | null>;
}
