import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../../logger.js";
import type { IOrderReadModelRepository } from "../../domain/interfaces/OrderReadModelRepository.js";
import { runAmqpConsumerLoop } from "@bitez/shared";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.order_events";
const ROUTING_KEYS = ["order.created", "order.updated"];

export function startOrderEventConsumer(
  url: string,
  orderReadModel: IOrderReadModelRepository,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ event: "order.events", queue: QUEUE });
  return runAmqpConsumerLoop(
    url,
    logger,
    "delivery-order-events",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      for (const key of ROUTING_KEYS) {
        await channel.bindQueue(QUEUE, EXCHANGE, key);
      }
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const p = JSON.parse(msg.content.toString()) as Record<string, unknown>;
          const orderId = String(p.orderId ?? "");
          if (!orderId) {
            channel.ack(msg);
            return;
          }
          const customerId = String(p.customerId ?? "");
          const restaurantId = String(p.restaurantId ?? "");
          const totalAmount = Number(p.totalAmount ?? 0);
          const status = String(p.status ?? "");
          const createdAt = p.createdAt ? new Date(String(p.createdAt)) : new Date();
          const deliveryAddress = p.deliveryAddress != null ? String(p.deliveryAddress) : undefined;
          const coordinates = p.coordinates as { lat?: number; lng?: number } | undefined;
          await orderReadModel.upsert({
            orderId,
            customerId,
            restaurantId,
            totalAmount,
            status,
            createdAt,
            deliveryAddress,
            coordinates,
          });
          log.info({ orderId }, "order read model upserted");
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "order.events consumer error");
          channel.nack(msg, false, true);
        }
      });
    },
    options,
  );
}
