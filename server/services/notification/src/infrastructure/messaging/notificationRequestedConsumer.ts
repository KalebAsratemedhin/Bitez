import amqp from "amqplib";
import type { Logger } from "../../logger.js";
import type { NotificationUseCase } from "../../application/usecases/NotificationUseCase.js";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "notification.requested";
const ROUTING_KEY = "notification.requested";

export async function startNotificationRequestedConsumer(
  url: string,
  notificationUseCase: NotificationUseCase,
  logger: Logger,
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  channel.prefetch(1);

  await channel.consume(QUEUE, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        userId?: string;
        message?: string;
        type?: string;
      };
      if (payload.userId && payload.message) {
        await notificationUseCase.create({
          userId: String(payload.userId),
          message: String(payload.message),
          type: payload.type ? String(payload.type) : undefined,
        });
      }
      channel.ack(msg);
    } catch (err) {
      log.error({ err }, "notification.requested consumer error");
      channel.nack(msg, false, true);
    }
  });
}
