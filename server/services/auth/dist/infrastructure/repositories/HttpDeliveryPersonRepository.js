export class HttpDeliveryPersonRepository {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async findByUserId(userId) {
        const url = `${this.baseUrl.replace(/\/$/, "")}/delivery-person/by-user/${encodeURIComponent(userId)}`;
        const token = process.env.INTERNAL_SERVICE_TOKEN?.trim();
        const headers = {};
        if (token)
            headers["X-Internal-Token"] = token;
        const res = await fetch(url, { headers });
        if (!res.ok)
            return null;
        const data = await res.json().catch(() => null);
        return data ?? null;
    }
}
