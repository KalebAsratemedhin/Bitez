import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "@bitez/shared";
import { runAmqpConsumerLoop } from "@bitez/shared";
import { RoutingKeys } from "@bitez/contracts";
import OrderSalesReadModel from "../persistence/models/orderSalesReadModel.js";

const EXCHANGE = "bitez";
const QUEUE = "restaurant.order.sales";

export function startOrderSalesEventConsumer(
  url: string,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ component: "orderSalesEventConsumer" });
  return runAmqpConsumerLoop(
    url,
    logger,
    "restaurant-order-sales",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, RoutingKeys.OrderCreated);
      await channel.bindQueue(QUEUE, EXCHANGE, RoutingKeys.OrderUpdated);
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const p = JSON.parse(msg.content.toString()) as Record<string, unknown>;
          const orderId = String(p.orderId ?? "");
          const customerId = String(p.customerId ?? "");
          const restaurantId = String(p.restaurantId ?? "");
          const totalAmount = Number(p.totalAmount ?? 0);
          const status = String(p.status ?? "");
          const createdAt = p.createdAt ? new Date(String(p.createdAt)) : new Date();
          if (orderId && customerId && restaurantId) {
            await OrderSalesReadModel.findOneAndUpdate(
              { orderId },
              { $set: { customerId, restaurantId, totalAmount, status, createdAt } },
              { upsert: true },
            );
          }
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "order sales projection error");
          channel.nack(msg, false, true);
        }
      });
    },
    options,
  );
}
