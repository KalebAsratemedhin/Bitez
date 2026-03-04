export interface IRestaurantRepository {
  create(data: Record<string, unknown>): Promise<unknown>;
  findById(id: string, populate?: string[]): Promise<unknown | null>;
  findByOwnerId(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<{ restaurants: unknown[]; total: number }>;
  findActive(
    filter: object,
    page: number,
    limit: number,
  ): Promise<{ restaurants: unknown[]; total: number }>;
  findActiveWithSearch(
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ restaurants: unknown[]; total: number }>;
  findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ restaurants: unknown[]; total: number }>;
  findByIdAndUpdate(id: string, update: Record<string, unknown>): Promise<unknown | null>;
  findByIdAndDelete(id: string): Promise<unknown | null>;
}
