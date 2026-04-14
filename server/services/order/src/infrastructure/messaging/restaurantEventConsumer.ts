import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../../logger.js";
import type { IRestaurantReadModelRepository } from "../../domain/interfaces/RestaurantReadModelRepository.js";
import { runAmqpConsumerLoop } from "@bitez/shared";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "order.restaurant.events";

export function startRestaurantEventConsumer(
  url: string,
  restaurantReadModel: IRestaurantReadModelRepository,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ event: "restaurant.events", queue: QUEUE });
  return runAmqpConsumerLoop(
    url,
    logger,
    "restaurant-events",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, "restaurant.created");
      await channel.bindQueue(QUEUE, EXCHANGE, "restaurant.updated");
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const p = JSON.parse(msg.content.toString()) as Record<string, unknown>;
          const restaurantId = String(p.restaurantId ?? "");
          const name = String(p.name ?? "");
          const status = String(p.status ?? "");
          const ownerId = p.ownerId != null ? String(p.ownerId) : undefined;
          if (restaurantId) {
            await restaurantReadModel.upsert({ restaurantId, name, status, ownerId });
            log.info({ restaurantId }, "restaurant read model upserted");
          }
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "restaurant.events consumer error");
          channel.nack(msg, false, true);
        }
      });
    },
    options,
  );
}
