export class HttpNotificationService {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async sendToUser(userId, message, type = "general") {
        const url = `${this.baseUrl.replace(/\/$/, "")}/notify`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, message, type }),
        }).catch(() => { });
    }
}
