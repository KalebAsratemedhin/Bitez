import BlacklistedToken from "../persistence/models/BlacklistedToken.js";
import type { IBlacklistedTokenRepository } from "../../domain/interfaces/index.js";

export class BlacklistedTokenRepository implements IBlacklistedTokenRepository {
  async add(token: string) {
    const exists = await BlacklistedToken.exists({ token });
    if (exists) return;
    await BlacklistedToken.create({ token });
  }

  async exists(token: string) {
    const doc = await BlacklistedToken.exists({ token });
    return !!doc;
  }
}
