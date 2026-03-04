import BlacklistedToken from "../persistence/models/BlacklistedToken.js";
export class BlacklistedTokenRepository {
    async add(token) {
        const exists = await BlacklistedToken.exists({ token });
        if (exists)
            return;
        await BlacklistedToken.create({ token });
    }
    async exists(token) {
        const doc = await BlacklistedToken.exists({ token });
        return !!doc;
    }
}
