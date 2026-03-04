import jwt from "jsonwebtoken";
export class TokenService {
    secret;
    defaultExpiry;
    constructor(secret, defaultExpiry = "7d") {
        this.secret = secret;
        this.defaultExpiry = defaultExpiry;
    }
    async sign(payload, expiresIn = this.defaultExpiry) {
        return jwt.sign(payload, this.secret, { expiresIn });
    }
    async verify(token) {
        return jwt.verify(token, this.secret);
    }
}
