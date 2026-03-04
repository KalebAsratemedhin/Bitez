export class HttpUserRepository {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async findById(id, options) {
        const url = `${this.baseUrl.replace(/\/$/, "")}/current-user`;
        const headers = { "Content-Type": "application/json" };
        if (options?.authHeader)
            headers.Authorization = options.authHeader;
        const res = await fetch(url, { headers });
        if (!res.ok)
            return null;
        const user = await res.json();
        const userId = user._id ?? user.id;
        if (userId && String(userId) !== id)
            return null;
        return user;
    }
}
