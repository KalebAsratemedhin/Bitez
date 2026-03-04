export interface IUserRepository {
  findById(id: string, options?: { authHeader?: string }): Promise<unknown | null>;
}
