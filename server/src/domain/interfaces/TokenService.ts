export interface ITokenService {
  sign(payload: object, expiresIn?: string): Promise<string>;
  verify(token: string): Promise<Record<string, unknown>>;
}
