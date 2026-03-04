import amqp from "amqplib";
const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.user.registered";
const ROUTING_KEY = "user.registered";
export async function startUserRegisteredConsumer(url, deliveryUseCase) {
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
            if (payload.role === "delivery_person" && payload.userId) {
                await deliveryUseCase.createDeliveryPerson({ userId: String(payload.userId) });
            }
            channel.ack(msg);
        }
        catch (err) {
            console.error("userRegisteredConsumer error:", err);
            channel.nack(msg, false, true);
        }
    });
    return async () => {
        await channel.close();
        await connection.close();
    };
}
