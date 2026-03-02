export interface IUserRepository {
  create(data: Record<string, unknown>): Promise<unknown>;
  findById(
    id: string,
    options?: { includePassword?: boolean; excludePassword?: boolean },
  ): Promise<unknown | null>;
  findByEmail(
    email: string,
    options?: { includePassword?: boolean },
  ): Promise<unknown | null>;
  findByIdAndUpdate(id: string, update: Record<string, unknown>): Promise<unknown | null>;
  findByIdAndDelete(id: string): Promise<unknown | null>;
  findAllPaginated(page: number, limit: number): Promise<{ users: unknown[]; total: number }>;
}
