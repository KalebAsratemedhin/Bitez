export interface IBlacklistedTokenRepository {
  add(token: string): Promise<unknown>;
  exists(token: string): Promise<boolean>;
}
