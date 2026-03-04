export class HttpDeliveryPersonRepository {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async findByUserId(userId) {
        const url = `${this.baseUrl.replace(/\/$/, "")}/delivery-person/by-user/${encodeURIComponent(userId)}`;
        const res = await fetch(url);
        if (!res.ok)
            return null;
        const data = await res.json().catch(() => null);
        return data ?? null;
    }
}
