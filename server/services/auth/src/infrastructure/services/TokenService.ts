import jwt from "jsonwebtoken";
import type { ITokenService } from "../../domain/interfaces/index.js";

export class TokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly defaultExpiry = "7d",
  ) {}

  async sign(payload: object, expiresIn = this.defaultExpiry): Promise<string> {
    return jwt.sign(payload as object, this.secret, { expiresIn } as jwt.SignOptions);
  }

  async verify(token: string): Promise<Record<string, unknown>> {
    return jwt.verify(token, this.secret) as Record<string, unknown>;
  }
}
