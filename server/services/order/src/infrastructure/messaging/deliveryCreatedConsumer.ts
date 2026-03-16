import amqp from "amqplib";
import type { Logger } from "../../logger.js";
import type { IOrderRepository } from "../../domain/interfaces/OrderRepository.js";
import type { INotificationService } from "../../domain/interfaces/NotificationService.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "order.delivery.created";
const ROUTING_KEY = "delivery.created";

export async function startDeliveryCreatedConsumer(
  url: string,
  orderRepository: IOrderRepository,
  notificationService: INotificationService,
  logger: Logger
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  channel.prefetch(1);

  // Idempotent: sending the same notification again is acceptable (at-most-once notification).
  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
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
}