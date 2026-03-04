import amqp from "amqplib";
const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "notification.requested";
const ROUTING_KEY = "notification.requested";
export async function startNotificationRequestedConsumer(url, notificationUseCase) {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
    channel.prefetch(1);
    await channel.consume(QUEUE, async (msg) => {
        if (!msg)
            return;
        try {
            const payload = JSON.parse(msg.content.toString());
            if (payload.userId && payload.message) {
                await notificationUseCase.create({
                    userId: String(payload.userId),
                    message: String(payload.message),
                    type: payload.type ? String(payload.type) : undefined,
                });
            }
            channel.ack(msg);
        }
        catch (err) {
            console.error("notificationRequestedConsumer error:", err);
            channel.nack(msg, false, true);
        }
    });
}
