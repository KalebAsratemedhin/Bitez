import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../../logger.js";
import type { IUserReadModelRepository } from "../../domain/interfaces/UserReadModelRepository.js";
import { runAmqpConsumerLoop } from "@bitez/shared";

const EXCHANGE = "bitez";
const QUEUE = "order.user.registered";
const ROUTING_KEY = "user.registered";

export function startUserRegisteredConsumer(
  url: string,
  userReadModel: IUserReadModelRepository,
  logger: Logger,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const log = logger.child({ event: ROUTING_KEY, queue: QUEUE });
  return runAmqpConsumerLoop(
    url,
    logger,
    "user-registered",
    async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
      channel.prefetch(1);

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const p = JSON.parse(msg.content.toString()) as Record<string, unknown>;
          const userId = String(p.userId ?? p._id ?? "");
          const name = String(p.name ?? "");
          const email = String(p.email ?? "");
          const phoneNumber = p.phoneNumber != null ? String(p.phoneNumber) : undefined;
          if (userId) {
            await userReadModel.upsert({ userId, name, email, phoneNumber });
            log.info({ userId }, "user read model upserted");
          }
          channel.ack(msg);
        } catch (err) {
          log.error({ err }, "user.registered consumer error");
          channel.nack(msg, false, true);
        }
      });
    },
    options,
  );
}
