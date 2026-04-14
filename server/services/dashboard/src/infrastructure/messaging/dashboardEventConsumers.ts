import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../../logger.js";
import {
  upsertOrderReadModel,
  upsertRestaurantReadModel,
  upsertDeliveryReadModel,
} from "../repositories/ReadModelRepositories.js";
import { runAmqpConsumerLoop } from "@bitez/shared";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";

const QUEUES = {
  order: "dashboard.order",
  restaurant: "dashboard.restaurant",
  delivery: "dashboard.delivery",
} as const;

const ROUTING_KEYS = {
  orderCreated: "order.created",
  orderUpdated: "order.updated",
  restaurantCreated: "restaurant.created",
  restaurantUpdated: "restaurant.updated",
  deliveryCreated: "delivery.created",
  deliveryUpdated: "delivery.updated",
} as const;

export function startDashboardEventConsumers(
  url: string,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ component: "dashboardEventConsumers" });
  return runAmqpConsumerLoop(
    url,
    logger,
    "dashboard-events",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      channel.prefetch(1);

      const bindAndConsume = async (
        queue: string,
        keys: string[],
        handler: (payload: Record<string, unknown>) => Promise<void>,
      ) => {
        await channel.assertQueue(queue, { durable: true });
        for (const key of keys) await channel.bindQueue(queue, EXCHANGE, key);
        await channel.consume(queue, async (msg: ConsumeMessage | null) => {
          if (!msg) return;
          try {
            const payload = JSON.parse(msg.content.toString()) as Record<string, unknown>;
            await handler(payload);
            channel.ack(msg);
          } catch (err) {
            log.error({ err, queue }, "Dashboard event consumer error");
            channel.nack(msg, false, true);
          }
        });
      };

      await bindAndConsume(
        QUEUES.order,
        [ROUTING_KEYS.orderCreated, ROUTING_KEYS.orderUpdated],
        async (p) => {
          const orderId = String(p.orderId ?? "");
          const customerId = String(p.customerId ?? "");
          const restaurantId = String(p.restaurantId ?? "");
          const totalAmount = Number(p.totalAmount ?? 0);
          const status = String(p.status ?? "");
          const createdAt = p.createdAt ? new Date(String(p.createdAt)) : new Date();
          if (orderId && customerId && restaurantId) {
            await upsertOrderReadModel({
              orderId,
              customerId,
              restaurantId,
              totalAmount,
              status,
              createdAt,
            });
          }
        },
      );

      await bindAndConsume(
        QUEUES.restaurant,
        [ROUTING_KEYS.restaurantCreated, ROUTING_KEYS.restaurantUpdated],
        async (p) => {
          const restaurantId = String(p.restaurantId ?? "");
          const ownerId = String(p.ownerId ?? "");
          const name = String(p.name ?? "");
          if (restaurantId && ownerId) {
            await upsertRestaurantReadModel({ restaurantId, ownerId, name });
          }
        },
      );

      await bindAndConsume(
        QUEUES.delivery,
        [ROUTING_KEYS.deliveryCreated, ROUTING_KEYS.deliveryUpdated],
        async (p) => {
          const deliveryId = String(p.deliveryId ?? "");
          const orderId = String(p.orderId ?? "");
          const deliveryPersonUserId = String(p.deliveryPersonUserId ?? "");
          const status = String(p.status ?? "");
          const createdAt = p.createdAt ? new Date(String(p.createdAt)) : new Date();
          if (deliveryId && deliveryPersonUserId) {
            await upsertDeliveryReadModel({
              deliveryId,
              orderId,
              deliveryPersonUserId,
              status,
              createdAt,
            });
          }
        },
      );
    },
    options,
  );
}
