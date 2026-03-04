import amqp from "amqplib";
import type { DeliveryUseCase } from "../../application/usecases/DeliveryUseCase.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.user.registered";
const ROUTING_KEY = "user.registered";

export async function startUserRegisteredConsumer(
  url: string,
  deliveryUseCase: DeliveryUseCase,
): Promise<() => Promise<void>> {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  channel.prefetch(1);

  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as { userId?: string; role?: string };
      if (payload.role === "delivery_person" && payload.userId) {
        await deliveryUseCase.createDeliveryPerson({ userId: String(payload.userId) });
      }
      channel.ack(msg);
    } catch {
      channel.nack(msg, false, true);
    }
  });

  return async () => {
    await channel.close();
    await connection.close();
  };
}
