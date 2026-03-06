import amqp from "amqplib";
import type { Logger } from "@bitez/logger";
import type { DeliveryUseCase } from "../../application/usecases/DeliveryUseCase.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.order.ready_for_delivery";
const ROUTING_KEY = "order.ready_for_delivery";

export async function startOrderReadyForDeliveryConsumer(
  url: string,
  deliveryUseCase: DeliveryUseCase,
  logger: Logger
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  channel.prefetch(1);

  // Idempotent: assign creates one delivery per orderId; enqueue upserts by orderId.
  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        orderId?: string;
        customerId?: string;
        restaurantId?: string;
        estimatedDeliveryTime?: string;
        deliveryAddress?: string;
        coordinates?: { lat?: number; lng?: number };
      };

      if (!payload.orderId || !payload.estimatedDeliveryTime) {
        channel.ack(msg);
        return;
      }

      try {
        await deliveryUseCase.assignDelivery({
          orderId: String(payload.orderId),
          estimatedDeliveryTime: new Date(payload.estimatedDeliveryTime),
          customerId: payload.customerId ? String(payload.customerId) : undefined,
        });
        log.info({ orderId: payload.orderId }, "order.ready_for_delivery assigned");
      } catch {
        await deliveryUseCase.enqueueOrderForDelivery({
          orderId: String(payload.orderId),
          customerId: payload.customerId ? String(payload.customerId) : undefined,
          restaurantId: payload.restaurantId ? String(payload.restaurantId) : undefined,
          estimatedDeliveryTime: new Date(payload.estimatedDeliveryTime),
          deliveryAddress: payload.deliveryAddress,
          coordinates: payload.coordinates,
        });
        log.info({ orderId: payload.orderId }, "order.ready_for_delivery enqueued");
      }

      channel.ack(msg);
    } catch (err) {
      log.error({ err }, "order.ready_for_delivery consumer error");
      channel.nack(msg, false, true);
    }
  });
}