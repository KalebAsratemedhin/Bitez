import amqp from "amqplib";
const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
/**
 * Topic publisher on the shared `bitez` exchange with reconnect on connection loss
 * and bounded backoff while RabbitMQ is unavailable.
 */
export class ReconnectingBitezEventPublisher {
    url;
    channel = null;
    connection = null;
    constructor(url) {
        this.url = url;
    }
    clearRefs() {
        this.channel = null;
        this.connection = null;
    }
    async ensureConnected() {
        if (this.channel)
            return this.channel;
        let backoffMs = 2000;
        for (;;) {
            try {
                const conn = await amqp.connect(this.url);
                this.connection = conn;
                conn.on("error", () => this.clearRefs());
                conn.on("close", () => this.clearRefs());
                const ch = await conn.createChannel();
                await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
                this.channel = ch;
                return ch;
            }
            catch {
                await new Promise((r) => setTimeout(r, backoffMs));
                backoffMs = Math.min(backoffMs * 2, 30_000);
                this.clearRefs();
            }
        }
    }
    async publish(routingKey, payload) {
        const body = Buffer.from(JSON.stringify(payload));
        for (let attempt = 0; attempt < 2; attempt++) {
            const ch = await this.ensureConnected();
            try {
                const ok = ch.publish(EXCHANGE, routingKey, body, { persistent: true });
                if (!ok)
                    throw new Error("Publish buffer full");
                return;
            }
            catch {
                this.clearRefs();
            }
        }
        throw new Error("Publish failed after reconnect");
    }
    async close() {
        try {
            if (this.channel)
                await this.channel.close();
        }
        catch {
            /* ignore */
        }
        try {
            if (this.connection)
                await this.connection.close();
        }
        catch {
            /* ignore */
        }
        finally {
            this.clearRefs();
        }
    }
}
