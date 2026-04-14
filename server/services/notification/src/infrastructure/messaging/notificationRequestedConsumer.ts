import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../../logger.js";
import type { NotificationUseCase } from "../../application/usecases/NotificationUseCase.js";
import { runAmqpConsumerLoop } from "@bitez/shared";

const EXCHANGE = "bitez";
const EXCHANGE_TYPE = "topic";
const QUEUE = "notification.requested";
const ROUTING_KEY = "notification.requested";

export function startNotificationRequestedConsumer(
  url: string,
  notificationUseCase: NotificationUseCase,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  return runAmqpConsumerLoop(
    url,
    logger,
    "notification-requested",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
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
    },
    options,
  );
}
