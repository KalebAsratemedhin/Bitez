import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../../logger.js";
import type { IOrderRepository } from "../../domain/interfaces/OrderRepository.js";
import type { INotificationService } from "../../domain/interfaces/NotificationService.js";
import { runAmqpConsumerLoop } from "@bitez/shared";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "order.delivery.created";
const ROUTING_KEY = "delivery.created";

export function startDeliveryCreatedConsumer(
  url: string,
  orderRepository: IOrderRepository,
  notificationService: INotificationService,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  return runAmqpConsumerLoop(
    url,
    logger,
    "delivery-created",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const payload = JSON.parse(msg.content.toString()) as { orderId?: string };
          if (!payload.orderId) {
            channel.ack(msg);
            return;
          }

          const order = await orderRepository.findById(String(payload.orderId));
          if (!order) {
            channel.ack(msg);
            return;
          }

          const orderRecord = order as { customerID?: unknown };
          const customerId =
            orderRecord.customerID != null ? String(orderRecord.customerID) : null;

          if (customerId) {
            await notificationService.sendToUser(
              customerId,
              "Your order has been assigned to a delivery person.",
            );
          }
          log.info({ orderId: payload.orderId }, "delivery.created notified");
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "delivery.created consumer error");
          channel.nack(msg, false, true);
        }
      });
    },
    options,
  );
}
