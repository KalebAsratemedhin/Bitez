import amqp from "amqplib";
import type { Logger } from "@bitez/logger";
import type { IRestaurantReadModelRepository } from "../../domain/interfaces/RestaurantReadModelRepository.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "order.restaurant_events";
const ROUTING_KEYS = ["restaurant.created", "restaurant.updated"];

export async function startRestaurantEventConsumer(
  url: string,
  restaurantReadModel: IRestaurantReadModelRepository,
  logger: Logger
): Promise<void> {
  const log = logger.child({ event: "restaurant.events", queue: QUEUE });
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE, EXCHANGE, key);
  }
  channel.prefetch(1);

  // Idempotent: upsert by restaurantId.
  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const p = JSON.parse(msg.content.toString()) as Record<string, unknown>;
      const restaurantId = String(p.restaurantId ?? "");
      const name = String(p.name ?? "");
      const status = String(p.status ?? "active");
      const ownerId = p.ownerId != null ? String(p.ownerId) : undefined;
      if (restaurantId) {
        await restaurantReadModel.upsert({ restaurantId, name, status, ownerId });
        log.info({ restaurantId }, "restaurant read model upserted");
      }
      channel.ack(msg);
    } catch (err) {
      log.error({ err }, "restaurant event consumer error");
      channel.nack(msg, false, true);
    }
  });
}
