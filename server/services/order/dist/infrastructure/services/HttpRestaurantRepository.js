export class HttpRestaurantRepository {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async findById(id) {
        const base = this.baseUrl.replace(/\/$/, "");
        const res = await fetch(`${base}/${id}`);
        if (!res.ok)
            return null;
        const data = await res.json().catch(() => null);
        return data?.data ?? data ?? null;
    }
}
