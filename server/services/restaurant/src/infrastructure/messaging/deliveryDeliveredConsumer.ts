import amqp from "amqplib";
import type { Logger } from "../../logger.js";
import type { IDeliveredToRepository } from "@domain/interfaces/DeliveredToRepository.ts";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "restaurant.delivery.delivered";
const ROUTING_KEY = "delivery.delivered";

export async function startDeliveryDeliveredConsumer(
  url: string,
  deliveredToRepository: IDeliveredToRepository,
  logger: Logger
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  channel.prefetch(1);

  // Idempotent: record() upserts by (deliveryPersonId, customerUserId).
  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const p = JSON.parse(msg.content.toString()) as Record<string, unknown>;
      const deliveryPersonId = String(p.deliveryPersonId ?? "");
      const customerId = String(p.customerId ?? "");
      if (deliveryPersonId && customerId) {
        await deliveredToRepository.record(deliveryPersonId, customerId);
        log.info({ deliveryPersonId, customerId }, "delivery.delivered recorded");
      }
      channel.ack(msg);
    } catch (err) {
      log.error({ err }, "delivery.delivered consumer error");
      channel.nack(msg, false, true);
    }
  });
}
