import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../../logger.js";
import type { DeliveryUseCase } from "../../application/usecases/DeliveryUseCase.js";
import { runAmqpConsumerLoop } from "@bitez/shared";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "delivery.order.ready_for_delivery";
const ROUTING_KEY = "order.ready_for_delivery";

export function startOrderReadyForDeliveryConsumer(
  url: string,
  deliveryUseCase: DeliveryUseCase,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  return runAmqpConsumerLoop(
    url,
    logger,
    "order-ready-for-delivery",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
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
    },
    options,
  );
}
