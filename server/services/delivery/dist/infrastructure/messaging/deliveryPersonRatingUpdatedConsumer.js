import amqp from "amqplib";
const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.person.rating.updated";
const ROUTING_KEY = "delivery_person.rating.updated";
export async function startDeliveryPersonRatingUpdatedConsumer(url, deliveryPersonRepository) {
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
            if (payload.deliveryPersonId != null && typeof payload.averageRating === "number") {
                await deliveryPersonRepository.updateRating(String(payload.deliveryPersonId), payload.averageRating);
            }
            channel.ack(msg);
        }
        catch (err) {
            console.error("deliveryPersonRatingUpdatedConsumer error:", err);
            channel.nack(msg, false, true);
        }
    });
    return async () => {
        await channel.close();
        await connection.close();
    };
}
