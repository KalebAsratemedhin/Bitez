import amqp from "amqplib";
const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
export class RabbitMQEventPublisher {
    url;
    channel = null;
    connection = null;
    constructor(url) {
        this.url = url;
    }
    async connect() {
        if (this.channel)
            return;
        const conn = await amqp.connect(this.url);
        this.connection = conn;
        this.channel = await conn.createChannel();
        await this.channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
    }
    async publish(routingKey, payload) {
        await this.connect();
        if (!this.channel)
            throw new Error("Channel not ready");
        const published = this.channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
        if (!published) {
            throw new Error("Publish buffer full");
        }
    }
    async close() {
        try {
            if (this.channel)
                await this.channel.close();
            if (this.connection)
                await this.connection.close();
        }
        finally {
            this.channel = null;
            this.connection = null;
        }
    }
}
